
const express = require("express");
const SignUp= require("./service");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const {
        lastName,
        firstName,
        email,
        password,
        phone,
        phone2,
        siretNumber,
        societeName,
        isSociete,
        role,
        idProfessionalType,
        addresses
        } = req.body;

        // Déterminer le booléen professional à partir de role string
        const professional = role === 'professionnel';

        // Mapper pour appel fonctions plus bas

        // Vérification des champs
        if (!firstName || !lastName || !email || !password || !professional || !role) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        // Créer l'utilisateur
        const newUser = await SignUp.createUser(email, password, firstName, lastName, professional);
        const userId = newUser.id
        // Créer les adresses
        // Gestion des adresses (main et billing)
        const validAddresses = addresses.filter(a => a.type && a.type.trim() !== '');

        const mainAddress = validAddresses.find(a => a.type.toLowerCase().trim() === 'main');
        const billingAddress = validAddresses.find(a => a.type.toLowerCase().trim() === 'billing');

        let addressId = null;
        if (mainAddress) {
        const { address, city, postalCode, country, type } = mainAddress;
        addressId = await SignUp.upsertAddressSignUp(userId, address, city, postalCode, country, type );
        }

        let billingId = null;
        if (billingAddress) {
            const { address, city, postalCode, country, type } = billingAddress;
            billingId = await SignUp.upsertAddressSignUp(userId, address, city, postalCode, country, type );
        }


        // Si le rôle est 'particulier', créer un client
        if (professional === false) {
           const customer =  await SignUp.signUpCustomers(userId, phone, phone2, isSociete, addressId, billingId, societeName);
           console.log(customer)
        }

        // Si le rôle est 'professionnel', créer un professionnel
        if (professional === true) {
           const pro =  await SignUp.signUpProfessional(userId, phone, phone2, societeName, addressId, siretNumber, idProfessionalType);
            console.log(pro);
        }

        res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

