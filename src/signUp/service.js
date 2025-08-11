const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
require("dotenv").config();
const admin = require('../config/firebase');
const pool = require("../config/db");

// const CLIENT_ID = process.env.INSEE_CLIENT_ID;
// const CLIENT_SECRET = process.env.INSEE_CLIENT_SECRET;

const signUp = async (first_name, last_name, email, password, professional) => {
    try {
        // Vérifier si l'utilisateur existe déjà
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.length > 0) {
            return { message: "L'utilisateur existe déjà" };
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        const uid = uuidv4()
        const cleanUid = uid.replace(/-/g, '');

        // Insérer le nouvel utilisateur
        const newUser = await pool.query(`
            INSERT INTO users (id, first_name, last_name, email, password, professional)
            VALUES (${cleanUid}, ${first_name}, ${last_name}, ${email}, ${hashedPassword}, ${professional})
            RETURNING id, first_name, last_name, email, professional
        `);

        // crée le user dans firebase
        syncUserWithFirebase(cleanUid,email,password,first_name,"")
        
        return newUser[0];
    } catch (error) {
        throw new Error(error.message);
    }
};

 const upsertAddress = async (userId, addressData) => {
    const client = await pool.connect();
    const { idAddress, address, city, postalCode, country, type } = addressData;

    if (idAddress !== undefined && idAddress !== null) {
      const checkRes = await client.query(
        'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
        [idAddress, userId]
      );
      if (checkRes.rows.length === 0) {
        throw new Error(`Adresse avec id ${idAddress} non trouvée pour cet utilisateur.`);
      }

      await client.query(
        `UPDATE addresses SET address = $1, city = $2, postal_code = $3, country = $4, updated_at = NOW()
        WHERE id = $5`,
        [address, city, postalCode , country, idAddress]
      );
      return idAddress;
    } else {
      const insertRes = await client.query(
        `INSERT INTO addresses (user_id, address, city, postal_code, country, type)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, address, city, postalCode, country , type]
      );
      return insertRes.rows[0].id;
    }
  }

// Fonction pour l'inscription du client
const signUpCustomers = async (userId, phone, phone2, isSociete, address_id, billing_address_id, societe_name) => {
    try {

        // Vérifier si l'utilisateur existe déjà dans la table des clients
        const existingCustomer = await pool.query(`
            SELECT * FROM customers WHERE user_id = $1
        `,[userId]);
            
        if (existingCustomer.length > 0) {
            throw new Error("Ce client existe déjà.");
        }


        // Insérer un nouveau client (customer)
        const newCustomer = await pool.query(`
            INSERT INTO customers (user_id, phone, phone2, address_id, billing_address_id, is_societe, societe_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, user_id ;
        `, [userId, phone, phone2,address_id, billing_address_id, isSociete, societe_name]);

        return newCustomer[0];
    } catch (error) {
        throw new Error("Erreur lors de la création du client : " + error.message);
    }
};


// Fonction pour l'inscription du client
const signUpProfessional = async (user_id, phone, phone2, societe_name, address_id, siret_number, professional_types_id, is_verified ) => {
    try {

        // Vérifier si l'utilisateur existe déjà dans la table des profesionnels
        const existingProfessional = await pool.query(`
            SELECT * FROM professionals WHERE user_id = $1
        `, [user_id]);
            
        if (existingProfessional.length > 0) {
            return { message: "Ce professionnel existe déjà." };
        }

        // Vérifier l'existence du type de profession
        const professionalTypeExists = await pool.query(`
            SELECT id FROM professional_types WHERE id = $1
        `,[professional_types_id]);
    
        if (professionalTypeExists.length === 0) {
            throw new Error("Le type de profession spécifié n'existe pas");
        }   

        // Insérer un nouveau professionnel
        const newProfessional  = await pool.query(`
            INSERT INTO professionals (user_id, phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id;
        `, [user_id,phone,phone2,address_id,siret_number,societe_name,professional_types_id,is_verified]);

        // Après la création du professionnel, vérifier le SIRET de manière asynchrone
        checkSiretAndUpdateVerification(newProfessional[0].id, siret_number);

        return newProfessional[0];
    } catch (error) {
        throw new Error("Erreur lors de la création du professionel : " + error.message);
    }
};


const getInseeToken = async () => {
    try {
        const credentials = Buffer.from(`${process.env.INSEE_CLIENT_ID}:${process.env.INSEE_CLIENT_SECRET}`).toString("base64");

        const response = await axios.post(
            "https://api.insee.fr/token",
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        return response.data.access_token;
    } catch (error) {
        console.error("Erreur lors de l'obtention du token INSEE :", error.response ? error.response.data : error.message);
        throw new Error("Impossible d'obtenir le token INSEE");
    }
};


// Test token INSEE
// getInseeToken()
//     .then(token => console.log("Token INSEE obtenu :", token))
//     .catch(err => console.error(err.message));

// Fonction pour vérifier le SIRET via l'API de l'INSEE
const verifySiretWithExternalService = async (siret) => {
    try {
        // Récupérer le token d'authentification
        const token = await getInseeToken();

        // URL pour la recherche SIRET
        const url = `https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`;

        // Effectuer la requête GET
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        // Vérifier si l'établissement existe et est actif
        if (response.data.etablissement) {
            const etablissement = response.data.etablissement;
            const isActive = etablissement.periodesEtablissement?.[0]?.etatAdministratifEtablissement === "A"; // "A" = Actif

            return {
                isValid: isActive,
                data: {
                    siret: etablissement.siret,
                    nom: etablissement.uniteLegale?.denominationUniteLegale || "Non disponible",
                    address: [
                        etablissement.adresseEtablissement?.numeroVoieEtablissement || "",
                        etablissement.adresseEtablissement?.typeVoieEtablissement || "",
                        etablissement.adresseEtablissement?.libelleVoieEtablissement || "",
                        etablissement.adresseEtablissement?.codePostalEtablissement || "",
                        etablissement.adresseEtablissement?.libelleCommuneEtablissement || ""
                    ].filter(Boolean).join(" ") // Assemble l'adresse proprement
                }
            };
        } else {
            return { isValid: false, message: "SIRET non valide ou entreprise non trouvée" };
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du SIRET :", error.message);
        return { isValid: false, message: "Erreur lors de la requête API INSEE" };
    }
};

// Fonction pour vérifier le SIRET et mettre à jour l'état de vérification
const checkSiretAndUpdateVerification = async (professionalId, siret) => {
    try {
        // Vérifier le SIRET via l'API de l'INSEE
        const siretData = await verifySiretWithExternalService(siret);

        // Mettre à jour is_verified dans la base de données
        await pool.query(`
            UPDATE professionals
            SET is_verified = ${siretData.isValid}
            WHERE id = ${professionalId}
        `);

        console.log(
            siretData.isValid
                ? `Le SIRET ${siret} est valide et actif.`
                : `Le SIRET ${siret} est invalide ou inactif.`
        );
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut de vérification :", error.message);
    }
};


// Fonction appelée après inscription côté PostgreSQL
async function syncUserWithFirebase(uid, email, password, displayName, photoURL) {

  try {
    // 1. Créer un utilisateur Firebase Auth (si pas déjà présent)
    const userData= {
      uid,
      email,
      password,
      displayName,
    };

    // Ajouter photoURL seulement si c'est une URL valide
    if (photoURL && isValidUrl(photoURL)) {
      userData.photoURL = photoURL;
    }

    const userRecord = await admin.auth().createUser(userData);

    // 2. Ajouter ce user à Firestore pour la messagerie
    await admin.firestore().collection('users').doc(uid).set({
      uid,
      email,
      displayName,
      photoURL: photoURL || "",
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      fcmToken: "", // à mettre à jour depuis Flutter
    });

    console.log("Utilisateur Firebase créé :", email);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log("Utilisateur déjà existant dans Firebase Auth");
    } else {
      console.error("Erreur lors de la création Firebase :", error);
    }
  }
}

// Fonction pour valider une URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

module.exports = { signUp, signUpCustomers, signUpProfessional, upsertAddress };
