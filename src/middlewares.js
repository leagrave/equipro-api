const jwt = require('jsonwebtoken');
require('dotenv').config();


const middlewares = {
  decodeJwt: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  checkAuthZHeader: (header, authZType) => {
    if (!header || typeof header !== 'string') {
      return [400, "En-tête Authorization manquante"];
    }
    const authType = header.split(' ')[0];
    if (authType !== authZType) {
      return [400, `Utilisez l'Authorization '${authZType}'`];
    }
    return [200, "En-tête valide"];
  },

  authMiddleware: (req, res, next) => {
    const authHeader = req.headers.authorization;
    const [status, message] = middlewares.checkAuthZHeader(authHeader, 'Bearer');
    if (status !== 200) {
      return res.status(status).json({ error: message });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = middlewares.decodeJwt(token);
      req.user = decoded; // on attache le payload décodé
      next();
    } catch (err) {
      console.error('Token invalide ou expiré:', err);
      return res.status(401).json({ error: "Token invalide ou expiré" });
    }
  },
};

module.exports = middlewares;
