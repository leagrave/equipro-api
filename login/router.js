const express = require("express");
const { login } = require("../login/service");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const data = await login(email, password);
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
