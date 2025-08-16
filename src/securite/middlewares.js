const jwt = require('jsonwebtoken');
const Joi = require('joi');
require('dotenv').config();

const middlewares = {
  decodeJwt: (token, secret = process.env.JWT_SECRET) => jwt.verify(token, secret),

  checkAuthZHeader: (header, authZType) => {
    if (!header || typeof header !== 'string') return [400, "En-tête Authorization manquante"];
    const authType = header.split(' ')[0];
    if (authType !== authZType) return [400, `Utilisez l'Authorization '${authZType}'`];
    return [200, "En-tête valide"];
  },

  authMiddleware: (req, res, next) => {
    const authHeader = req.headers.authorization;
    const [status, message] = middlewares.checkAuthZHeader(authHeader, 'Bearer');
    if (status !== 200) return res.status(status).json({ error: message });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = middlewares.decodeJwt(token);
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Token invalide ou expiré:', err);
      return res.status(401).json({ error: "Token invalide ou expiré" });
    }
  },

  verifyRole: (roles) => (req, res, next) => {
    const userRole = req.user.professional ? 'pro' : 'user';
    if (!roles.includes(userRole)) return res.status(403).json({ message: 'Accès refusé' });
    next();
  },

  validateBody: (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
  },

  // Guard ownership: s’assurer que l’utilisateur peut accéder à la ressource
 ensureOwnership: (getResourceOwner) => async (req, res, next) => {
    try {
      const ownerId = await getResourceOwner(req); // ex: récupère pro_id du record
      const userProId = req.user?.pro_id;
      if (ownerId && userProId && ownerId !== userProId) {
        return res.status(403).json({ error: "Accès refusé (ownership)" });
      }
      next();
    } catch (e) {
      next(e);
    }
  },
};

module.exports = middlewares;
