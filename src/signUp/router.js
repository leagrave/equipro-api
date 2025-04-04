// Router : router.js
const express = require("express");
const { signUp, signUpCustomers, signUpProfessional } = require("../signUp/service");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { first_name, last_name, email, password, role_name, phone, phone2, address, billing_address, societeName, sirenNumber, professionalType } = req.body;

        // Vérification des champs
        if (!first_name || !last_name || !email || !password || !role_name) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        // Créer l'utilisateur
        const newUser = await signUp(first_name, last_name, email, password, role_name);

        // Si le rôle est 'particulier', créer un client
        if (role_name === 'particulier') {
            await signUpCustomers(newUser.id, phone, phone2, req.body.isSociete, address, billing_address);
        }

        // Si le rôle est 'professionnel', créer un professionnel
        if (role_name === 'professionnel') {
            await signUpProfessional(newUser.id, phone, phone2, societeName, address, sirenNumber, professionalType);
        }

        res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

