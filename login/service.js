require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const login = async (email, password) => {
  try {
    // Vérifier si l'utilisateur existe
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (result.length === 0) {
      throw new Error("Utilisateur non trouvé");
    }

    const user = result[0];

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log(isMatch)
      throw new Error("Mot de passe incorrect");
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email } };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { login };
