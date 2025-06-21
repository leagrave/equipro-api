const express = require('express');
const router = express.Router();
const Horse = require('./service');

//  POST /api/horse
router.post('/horse', async (req, res) => {
  const { user_id, horse, address } = req.body;

  if (!user_id || !horse || !address) {
    return res.status(400).json({ error: 'user_id, horse et address sont requis' });
  }

  try {
    const createdHorse = await Horse.createHorseWithAddressAndUser(horse, address, user_id);
    res.status(201).json(createdHorse);
  } catch (err) {
    console.error('Erreur création cheval :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  GET /api/horses
router.get('/horses', async (req, res) => {
  try {
    const horses = await Horse.getAllHorses();
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  GET /api/horses/:id
router.get('/horse/:id', async (req, res) => {
  try {
    const horse = await Horse.getHorseById(req.params.id);
    if (!horse) return res.status(404).json({ error: 'Cheval non trouvé' });
    res.json(horse);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  GET /api/horses/:user_id
router.get('/horses/user/:user_id', async (req, res) => {
  try {
    const horses = await Horse.getHorsesByUserId(req.params.user_id);
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/horses/:id
router.delete('/horse/:id', async (req, res) => {
  try {
    await Horse.deleteHorse(req.params.id);
    res.json({ message: 'Cheval supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;