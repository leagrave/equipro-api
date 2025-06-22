const express = require('express');
const router = express.Router();
const AddressService = require('./service');

// Créer une nouvelle adresse
router.post('/adresse', async (req, res) => {
  try {
    const address = await AddressService.createAddress(req.body);
    res.status(201).json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'adresse' });
  }
});

// Modifier une adresse existante
router.put('/adresse/:id', async (req, res) => {
  try {
    const address = await AddressService.updateAddress(req.params.id, req.body);
    if (!address) return res.status(404).json({ error: 'Adresse non trouvée' });
    res.json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'adresse' });
  }
});

// Supprimer une adresse
router.delete('/adresse/:id', async (req, res) => {
  try {
    const deleted = await AddressService.deleteAddress(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Adresse non trouvée' });
    res.json({ message: 'Adresse supprimée', id: deleted.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Obtenir toutes les adresses d’un utilisateur
router.get('/adresses/user/:userId', async (req, res) => {
  try {
    const addresses = await AddressService.getAddressesByUser(req.params.userId);
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses' });
  }
});

// Obtenir toutes les adresses d’un cheval
router.get('/adresse/horse/:horseId', async (req, res) => {
  try {
    const addresses = await AddressService.getAddressesByHorse(req.params.horseId);
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses' });
  }
});

module.exports = router;
