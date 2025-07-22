
const express = require("express");
const { signUp, signUpCustomers, signUpProfessional } = require("../signUp/service");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { first_name, last_name, email, password, professional, phone, phone2, address, billing_address, societeName, siretNumber, professionalType } = req.body;

        // Vérification des champs
        if (!first_name || !last_name || !email || !password || !professional) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        // Créer l'utilisateur
        const newUser = await signUp(first_name, last_name, email, password, professional);

        // Si le rôle est 'particulier', créer un client
        if (professional === false) {
            await signUpCustomers(newUser.id, phone, phone2, req.body.isSociete, address, billing_address);
        }

        // Si le rôle est 'professionnel', créer un professionnel
        if (professional === true) {
            await signUpProfessional(newUser.id, phone, phone2, societeName, address, siretNumber, professionalType);
        }

        res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

