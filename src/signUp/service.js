const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const sql = neon(process.env.DATABASE_URL);

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
const signUpProfessional = async (userId, phone, phone2, societeName, address, sirenNumber, professionalType) => {
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
            INSERT INTO professionals (user_id, phone, phone2, address_id, siren_number, societe_name, professional_types_id)
            VALUES (${userId}, ${phone}, ${phone2}, ${addressId}, ${sirenNumber}, ${societeName}, ${professionalTypeId})
            RETURNING id, user_id;
        `;

        return newProfessional[0];
    } catch (error) {
        throw new Error("Erreur lors de la création du client : " + error.message);
    }
};



module.exports = { signUp, signUpCustomers, signUpProfessional };
