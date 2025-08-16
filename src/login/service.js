require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require('../config/db');
const logger = require('../securite/logger'); 


const login = async (email, password) => {
  try {
    // On récupère l'utilisateur et son pro_id via une LEFT JOIN
    const result = await pool.query(
      `SELECT u.*, p.id AS pro_id
       FROM users u
       LEFT JOIN professionals p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Tentative login échouée : utilisateur non trouvé - ${email}`);
      throw new Error("Utilisateur non trouvé");
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn(`Tentative login échouée : mot de passe incorrect - ${email}`);
      throw new Error("Mot de passe incorrect");
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        professional: user.professional,
        pro_id: user.pro_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`Connexion réussie - ${email}`);

    return {
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        professional: user.professional,
        pro_id: user.pro_id 
      }
    };
  }  catch (error) {
    logger.error(`Erreur login pour ${email} : ${error.message}`);
    throw new Error(error.message);
  }
};


module.exports = { login };
