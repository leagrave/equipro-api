const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const sql = neon(process.env.DATABASE_URL);

const signUp = async (first_name, last_name, email, password, role_name) => {
    try {
        // Vérifier si l'utilisateur existe déjà
        const userExists = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userExists.length > 0) {
            throw new Error("L'utilisateur existe déjà");
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

module.exports = { signUp };
