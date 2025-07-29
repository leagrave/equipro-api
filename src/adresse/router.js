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


// Créer des adresses
router.post('/adresses', async (req, res) => {
  const { address, city, postal_code, country , latitude, longitude, user_id, horse_id, type } = req.body;

  if (!address || !city || !postal_code || !user_id) {
    return res.status(400).json({ error: 'L\'adresse principale est obligatoire (address, city, postal_code)' });
  }

  try {
    const addresses = await AddressService.createAddress(address, city, postal_code, country , latitude, longitude, user_id, horse_id, type);
    res.status(201).json(addresses);
  } catch (error) {
    console.error('Erreur lors de la création des adresses:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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
    
    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ error: "Aucune adresse trouvée pour cet utilisateur." });
    }

    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses' });
  }
});

// Obtenir l'adresses d’un utilisateur
router.get('/address/:id', async (req, res) => {

  try {
    const address = await AddressService.getAddressesByAddressId(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Adresse non trouvée" });
    }
    console.log(address)
    res.json(address);
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
