const express = require("express");
const { login, refresh } = require("./service");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  console.log("Login request received");
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });
    const data = await login(email, password);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: "refreshToken requis" });
    const data = refresh(refreshToken);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
