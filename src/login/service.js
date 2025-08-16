require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const pool = require("../config/db");
const { logger } = require("../securite/error-handlers");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const attempts = {};
const MAX = 5;
const BLOCK_MS = 15 * 60 * 1000;

const signAccess = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
const signRefresh = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

const login = async (email, password) => {
  const { error } = loginSchema.validate({ email, password });
  if (error) throw new Error("Entrée invalide");

  const now = Date.now();
  const a = attempts[email] || { c: 0, t: now };
  if (a.c >= MAX && now - a.t < BLOCK_MS) {
    logger.warn(`Blocage login (bruteforce) - ${email}`);
    throw new Error("Trop de tentatives. Réessayez plus tard.");
  }

  const { rows } = await pool.query(
    `SELECT u.*, p.id AS pro_id
     FROM users u LEFT JOIN professionals p ON p.user_id = u.id
     WHERE u.email = $1`,
    [email]
  );
  if (!rows.length) {
    attempts[email] = { c: a.c + 1, t: now };
    logger.warn(`Login échoué (user introuvable) - ${email}`);
    throw new Error("Utilisateur non trouvé");
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    attempts[email] = { c: a.c + 1, t: now };
    logger.warn(`Login échoué (mdp) - ${email}`);
    throw new Error("Mot de passe incorrect");
  }

  attempts[email] = { c: 0, t: now };

  const payload = { id: user.id, email: user.email, professional: user.professional, pro_id: user.pro_id };
  const token = signAccess(payload);
  const refreshToken = signRefresh(payload);

  logger.info(`Login OK - ${email}`);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      professional: user.professional,
      pro_id: user.pro_id,
    },
  };
};

const refresh = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id, email, professional, pro_id } = decoded;
    return { token: signAccess({ id, email, professional, pro_id }) };
  } catch {
    const e = new Error("Refresh token invalide ou expiré");
    e.status = 401;
    throw e;
  }
};

module.exports = { login, refresh };
