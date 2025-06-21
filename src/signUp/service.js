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
        const userExists = await pool.query(`SELECT * FROM users WHERE email = ${email}`);
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

// Fonction pour l'inscription du client
const signUpCustomers = async (userId, phone, phone2, isSociete, address, billing_address) => {
    try {

        // Vérifier si l'utilisateur existe déjà dans la table des clients
        const existingCustomer = await pool.query(`
            SELECT * FROM customers WHERE user_id = ${userId}
        `);
            
        if (existingCustomer.length > 0) {
            throw new Error("Ce client existe déjà.");
        }


        let addressId = null;
        let addressIdBilling = null;

        // Vérifier si l'adresse est fournie, sinon ne pas l'inclure dans la requête
        if (Array.isArray(address) && address.length > 0) {
            const newAddress = await pool.query(`
                INSERT INTO addresses (adress, city, postal_code, country)
                VALUES (${address[0].adress}, ${address[0].city}, ${address[0].postal_code}, ${address[0].country || 'France'})
                RETURNING id;
            `);
            addressId = newAddress[0].id;
        }

        // Vérifier si l'adresse de facturation est fournie, sinon ne pas l'inclure dans la requête
        if (Array.isArray(billing_address) && billing_address.length > 0) {
            const newAddressBilling = await pool.query(`
                INSERT INTO addresses (adress, city, postal_code, country)
                VALUES (${billing_address[0].adress}, ${billing_address[0].city}, ${billing_address[0].postal_code}, ${billing_address[0].country || 'France'})
                RETURNING id;
            `);
            addressIdBilling = newAddressBilling[0].id;
        }

        // Insérer un nouveau client (customer)
        const newCustomer = await pool.query(`
            INSERT INTO customers (user_id, phone, phone2, address_id, billing_address_id, is_societe)
            VALUES (${userId}, ${phone}, ${phone2}, ${addressId}, ${addressIdBilling}, ${isSociete || false})
            RETURNING id, user_id, phone;
        `);

        return newCustomer[0];
    } catch (error) {
        throw new Error("Erreur lors de la création du client : " + error.message);
    }
};


// Fonction pour l'inscription du client
const signUpProfessional = async (userId, phone, phone2, societeName, address, siretNumber, professionalType) => {
    try {

        // Vérifier si l'utilisateur existe déjà dans la table des profesionnels
        const existingProfessional = await pool.query(`
            SELECT * FROM professionals WHERE user_id = ${userId}
        `);
            
        if (existingProfessional.length > 0) {
            return { message: "Ce professionnel existe déjà." };
        }

        // Vérifier l'existence du type de profession
        const professionalTypeExists = await pool.query(`
            SELECT id FROM professional_types WHERE professional_type_name = ${professionalType}
        `);
    
        if (professionalTypeExists.length === 0) {
            throw new Error("Le type de profession spécifié n'existe pas");
        }   
        const professionalTypeId = professionalTypeExists[0].id;


        // Vérifier si l'adresse est fournie, sinon ne pas l'inclure dans la requête
        let addressId = null;
        if (Array.isArray(address) && address.length > 0) {
            const newAddress = await pool.query(`
                INSERT INTO addresses (adress, city, postal_code, country)
                VALUES (${address[0].adress}, ${address[0].city}, ${address[0].postal_code}, ${address[0].country || 'France'})
                RETURNING id;
            `);
            addressId = newAddress[0].id;
        }


        // Insérer un nouveau professionnel
        const newProfessional  = await pool.query(`
            INSERT INTO professionals (user_id, phone, phone2, address_id, siret_number, societe_name, professional_types_id)
            VALUES (${userId}, ${phone}, ${phone2}, ${addressId}, ${siretNumber}, ${societeName}, ${professionalTypeId})
            RETURNING id, user_id;
        `);

        // Après la création du professionnel, vérifier le SIRET de manière asynchrone
        checkSiretAndUpdateVerification(newProfessional[0].id, siretNumber);

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
                    adresse: [
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

module.exports = { signUp, signUpCustomers, signUpProfessional };
