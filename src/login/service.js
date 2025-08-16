require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require('../config/db');
const logger = require('../securite/logger');
const Joi = require("joi");

// Limitation brute force
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutes

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const login = async (email, password) => {
  try {
    // Validation des données
    const { error } = loginSchema.validate({ email, password });
    if (error) throw new Error("Entrée invalide");

    // Vérification brute force
    const attempt = loginAttempts[email] || { count: 0, last: Date.now() };
    if (attempt.count >= MAX_ATTEMPTS && (Date.now() - attempt.last < BLOCK_TIME)) {
      throw new Error("Trop de tentatives. Réessayez plus tard.");
    }

    // Récupération utilisateur
    const result = await pool.query(
      `SELECT u.*, p.id AS pro_id
       FROM users u
       LEFT JOIN professionals p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Tentative login échouée : utilisateur non trouvé - ${email}`);
      loginAttempts[email] = { count: attempt.count + 1, last: Date.now() };
      throw new Error("Utilisateur non trouvé");
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn(`Tentative login échouée : mot de passe incorrect - ${email}`);
      loginAttempts[email] = { count: attempt.count + 1, last: Date.now() };
      throw new Error("Mot de passe incorrect");
    }

    // Réinitialiser compteur après succès
    loginAttempts[email] = { count: 0, last: Date.now() };

    // Création JWT
    const payload = {
      id: user.id,
      email: user.email,
      professional: user.professional,
      pro_id: user.pro_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    logger.info(`Connexion réussie - ${email}`);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        professional: user.professional,
        pro_id: user.pro_id
      }
    };
  } catch (error) {
    logger.error(`Erreur login pour ${email} : ${error.message}`);
    throw new Error(error.message);
  }
};

module.exports = { login };
