const express = require("express");
const { signUp } = require("../signUp/service");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { first_name, last_name, email, password, role_name } = req.body;

        if (!first_name || !last_name || !email || !password || !role_name) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        const newUser = await signUp(first_name, last_name, email, password, role_name);
        res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
