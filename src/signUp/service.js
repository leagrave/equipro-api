const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
require("dotenv").config();
const admin = require('../config/firebase');
const pool = require("../config/db");


const SignUp = {

    
  async upsertAddressSignUp(userId, address, city, postalCode, country, type ) {
      const insertRes = await pool.query(
        `INSERT INTO addresses (user_id, address, city, postal_code, country, type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, address, city, postalCode, country, type]
      );
      return insertRes.rows[0].id;
  },

  async createUser(email, password, first_name, last_name, professional) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const uid = uuidv4();
    const cleanUid = uid.replace(/-/g, '');

    const result = await pool.query(
      `INSERT INTO users (id, email, password, first_name, last_name, professional) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cleanUid, email, hashedPassword, first_name, last_name, professional]
    );

    // crée le user dans firebase
//       // Lancer la synchro Firebase SANS attendre, pour ne pas bloquer
  this.syncUserWithFirebase(cleanUid, email, password, first_name, "")
    .catch(err => console.error("Sync Firebase échouée :", err.message));


    return result.rows[0];
  },

  // Fonction appelée après inscription côté PostgreSQL
  async syncUserWithFirebase(uid, email, password, displayName, photoURL) {
    try {
        const userData = {
        uid,
        email,
        password,
        displayName,
        };

        if (photoURL && isValidUrl(photoURL)) {
        userData.photoURL = photoURL;
        }

        // Création dans Firebase Auth
        const userRecord = await admin.auth().createUser(userData);

        // Création dans Firestore
        await admin.firestore().collection('users').doc(uid).set({
        uid,
        email,
        displayName,
        photoURL: photoURL || "",
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        fcmToken: "",
        });

        console.log("Utilisateur Firebase créé :", email);

    } catch (error) {
        // Ici, on capture TOUT et on ne rejette jamais
        if (error.code === 'auth/email-already-exists') {
        console.warn(`Utilisateur déjà existant dans Firebase Auth : ${email}`);
        } else {
        console.error(`Erreur lors de la création Firebase pour ${email} :`, error.message);
        }
    }
    },


  async signUpCustomers(userId, phone, phone2, isSociete, address_id, billing_address_id, societe_name) {
    try {
      const existingCustomer = await pool.query(
        `SELECT * FROM customers WHERE user_id = $1`,
        [userId]
      );

      if (existingCustomer.rows.length > 0) {
        throw new Error("Ce client existe déjà.");
      }

      const newCustomer = await pool.query(
        `INSERT INTO customers (user_id, phone, phone2, address_id, billing_address_id, is_societe, societe_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id;`,
        [userId, phone, phone2, address_id, billing_address_id, isSociete, societe_name]
      );

      return newCustomer.rows[0];
    } catch (error) {
      throw new Error("Erreur lors de la création du client : " + error.message);
    }
  },

async signUpProfessional(userId, phone, phone2, societeName, addressId, siretNumber, idProfessionalType) {
  try {
    const existingProfessional = await pool.query(
      `SELECT * FROM professionals WHERE user_id = $1`,
      [userId]
    );

    if (existingProfessional.rows.length > 0) {
      return { message: "Ce professionnel existe déjà." };
    }

    const siret = siretNumber.trim();

    if (!siret || siret.length !== 14) {
    throw new Error('Le numéro SIRET doit contenir exactement 14 caractères.');
    }


    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) throw new Error("User_id invalide");

    const addressCheck = await pool.query('SELECT id FROM addresses WHERE id = $1', [addressId]);
    if (addressCheck.rows.length === 0) throw new Error("address_id invalide");

    const profTypeCheck = await pool.query('SELECT id FROM professional_types WHERE id = $1', [idProfessionalType]);
    if (profTypeCheck.rows.length === 0) throw new Error("professional_types_id invalide");

    // Insert
    const newProfessional = await pool.query(
      `INSERT INTO professionals (user_id, phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id;`,
      [userId, phone, phone2 || null, addressId, siret, societeName, idProfessionalType, false]
    );

    console.log('Insertion réussie :', newProfessional.rows[0]);
    return newProfessional.rows[0];
  } catch (error) {
    console.error("Erreur SQL signUpProfessional :", error);
    throw error;
  }
},


  async getInseeToken() {
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
  },

  async verifySiretWithExternalService(siret) {
    try {
      const token = await SignUp.getInseeToken();
      const url = `https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });

      if (response.data.etablissement) {
        const e = response.data.etablissement;
        const isActive = e.periodesEtablissement?.[0]?.etatAdministratifEtablissement === "A";
        return {
          isValid: isActive,
          data: {
            siret: e.siret,
            nom: e.uniteLegale?.denominationUniteLegale || "Non disponible",
            address: [
              e.adresseEtablissement?.numeroVoieEtablissement || "",
              e.adresseEtablissement?.typeVoieEtablissement || "",
              e.adresseEtablissement?.libelleVoieEtablissement || "",
              e.adresseEtablissement?.codePostalEtablissement || "",
              e.adresseEtablissement?.libelleCommuneEtablissement || ""
            ].filter(Boolean).join(" ")
          }
        };
      } else {
        return { isValid: false, message: "SIRET non valide ou entreprise non trouvée" };
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du SIRET :", error.message);
      return { isValid: false, message: "Erreur lors de la requête API INSEE" };
    }
  },

  async checkSiretAndUpdateVerification(professionalId, siret) {
    try {
      const siretData = await SignUp.verifySiretWithExternalService(siret);
      await pool.query(
        `UPDATE professionals SET is_verified = $1 WHERE id = $2`,
        [siretData.isValid, professionalId]
      );
      console.log(
        siretData.isValid
          ? `Le SIRET ${siret} est valide et actif.`
          : `Le SIRET ${siret} est invalide ou inactif.`
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de vérification :", error.message);
    }
  },


  isValidUrl: (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
};

module.exports = SignUp;
