const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
require("dotenv").config();

const sql = neon(process.env.DATABASE_URL);

const CLIENT_ID = process.env.INSEE_CLIENT_ID;
const CLIENT_SECRET = process.env.INSEE_CLIENT_SECRET;

const signUp = async (first_name, last_name, email, password, role_name) => {
    try {
        // Vérifier si l'utilisateur existe déjà
        const userExists = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userExists.length > 0) {
            return { message: "L'utilisateur existe déjà" };
        }

        // Récupérer l'ID du rôle (ou assigner un rôle par défaut)
        let roleId;
        const role = await sql`SELECT id FROM roles WHERE role_name = ${role_name}`;
        
        if (role.length > 0) {
            roleId = role[0].id;
        } else {
            throw new Error("Le rôle spécifié n'existe pas");
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer le nouvel utilisateur
        const newUser = await sql`
            INSERT INTO users (id, first_name, last_name, email, password, role_id)
            VALUES (${uuidv4()}, ${first_name}, ${last_name}, ${email}, ${hashedPassword}, ${roleId})
            RETURNING id, first_name, last_name, email, role_id
        `;

        return newUser[0];
    } catch (error) {
        throw new Error(error.message);
    }
};

// Fonction pour l'inscription du client
const signUpCustomers = async (userId, phone, phone2, isSociete, address, billing_address) => {
    try {

        // Vérifier si l'utilisateur existe déjà dans la table des clients
        const existingCustomer = await sql`
            SELECT * FROM customers WHERE user_id = ${userId}
        `;
            
        if (existingCustomer.length > 0) {
            throw new Error("Ce client existe déjà.");
        }


        let addressId = null;
        let addressIdBilling = null;

        // Vérifier si l'adresse est fournie, sinon ne pas l'inclure dans la requête
        if (Array.isArray(address) && address.length > 0) {
            const newAddress = await sql`
                INSERT INTO addresses (adress, city, postal_code, country)
                VALUES (${address[0].adress}, ${address[0].city}, ${address[0].postal_code}, ${address[0].country || 'France'})
                RETURNING id;
            `;
            addressId = newAddress[0].id;
        }

        // Vérifier si l'adresse de facturation est fournie, sinon ne pas l'inclure dans la requête
        if (Array.isArray(billing_address) && billing_address.length > 0) {
            const newAddressBilling = await sql`
                INSERT INTO addresses (adress, city, postal_code, country)
                VALUES (${billing_address[0].adress}, ${billing_address[0].city}, ${billing_address[0].postal_code}, ${billing_address[0].country || 'France'})
                RETURNING id;
            `;
            addressIdBilling = newAddressBilling[0].id;
        }

        // Insérer un nouveau client (customer)
        const newCustomer = await sql`
            INSERT INTO customers (user_id, phone, phone2, address_id, billing_address_id, is_societe)
            VALUES (${userId}, ${phone}, ${phone2}, ${addressId}, ${addressIdBilling}, ${isSociete || false})
            RETURNING id, user_id, phone;
        `;

        return newCustomer[0];
    } catch (error) {
        throw new Error("Erreur lors de la création du client : " + error.message);
    }
};


// Fonction pour l'inscription du client
const signUpProfessional = async (userId, phone, phone2, societeName, address, siretNumber, professionalType) => {
    try {

        // Vérifier si l'utilisateur existe déjà dans la table des profesionnels
        const existingProfessional = await sql`
            SELECT * FROM professionals WHERE user_id = ${userId}
        `;
            
        if (existingProfessional.length > 0) {
            return { message: "Ce professionnel existe déjà." };
        }

        // Vérifier l'existence du type de profession
        const professionalTypeExists = await sql`
            SELECT id FROM professional_types WHERE professional_type_name = ${professionalType}
        `;
    
        if (professionalTypeExists.length === 0) {
            throw new Error("Le type de profession spécifié n'existe pas");
        }   
        const professionalTypeId = professionalTypeExists[0].id;


        // Vérifier si l'adresse est fournie, sinon ne pas l'inclure dans la requête
        let addressId = null;
        if (Array.isArray(address) && address.length > 0) {
            const newAddress = await sql`
                INSERT INTO addresses (adress, city, postal_code, country)
                VALUES (${address[0].adress}, ${address[0].city}, ${address[0].postal_code}, ${address[0].country || 'France'})
                RETURNING id;
            `;
            addressId = newAddress[0].id;
        }


        // Insérer un nouveau professionnel
        const newProfessional  = await sql`
            INSERT INTO professionals (user_id, phone, phone2, address_id, siret_number, societe_name, professional_types_id)
            VALUES (${userId}, ${phone}, ${phone2}, ${addressId}, ${siretNumber}, ${societeName}, ${professionalTypeId})
            RETURNING id, user_id;
        `;

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
        await sql`
            UPDATE professionals
            SET is_verified = ${siretData.isValid}
            WHERE id = ${professionalId}
        `;

        console.log(
            siretData.isValid
                ? `Le SIRET ${siret} est valide et actif.`
                : `Le SIRET ${siret} est invalide ou inactif.`
        );
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut de vérification :", error.message);
    }
};




module.exports = { signUp, signUpCustomers, signUpProfessional };
