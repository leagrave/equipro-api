const express = require('express');
const router = express.Router();
const Horse = require('./service');
const middlewares = require('../securite/middlewares');

//  POST /api/horse
router.post('/horse',middlewares.authMiddleware, async (req, res) => {
  const { users, horse, address } = req.body;


  if (!users || !horse ) {
    return res.status(400).json({ error: 'un propriétaire et des infos sur le cheval sont requis' });
  }

  try {
    const createdHorse = await Horse.createHorseWithAddressAndUser(horse, address, users);
    res.status(201).json(createdHorse);
  } catch (err) {
    console.error('Erreur création cheval :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  GET /api/horses/:id
router.get('/horse/by-id/:id',middlewares.authMiddleware, async (req, res) => {

  try {
    const horse = await Horse.getFullHorseById(req.params.id);
    if (!horse) return res.status(404).json({ error: 'Cheval non trouvé' });
    res.json(horse);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


//  GET /api/horses
router.get('/horses',middlewares.authMiddleware, async (req, res) => {
  try {
    const horses = await Horse.getAllHorses();
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  GET /api/infosHorse
router.get('/infosHorse',middlewares.authMiddleware, async (req, res) => {
  try {
    const horses = await Horse.getAllInfosHorses();
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/horse/test', async (req, res) => {
  try {
    const test = await Horse.getHorseByIdTest();
    console.log("✅ Résultat du test :", test);
    res.json(test);
  } catch (err) {
    console.error("❌ Erreur test :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});




//  GET /api/horses/:user_id
router.get('/horses/user/:user_id',middlewares.authMiddleware, async (req, res) => {
  try {
    const horses = await Horse.getHorsesByUserId(req.params.user_id);
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  GET /api/horses/:user_id
router.post('/horses/users',middlewares.authMiddleware, async (req, res) => {
    const { userIds } = req.body;

  try {
    const horses = await Horse.getHorsesByUsersId(userIds);
 
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  PUT /api/horse/:horse_id
router.put('/horse/:id',middlewares.authMiddleware, async (req, res) => {
    const horseId = req.params.id;
    const {
      name,
      age,
      stable_id,
      address_id,
      last_visit_date,
      next_visit_date,
      notes,
      breed_ids,       
      color_ids,      
      feed_type_ids,  
      activity_type_ids 
    } = req.body;

  try {
    const horses = await Horse.putHorsesByHorseId(
      horseId,      
      name,
      age,
      stable_id,
      address_id,
      last_visit_date,
      next_visit_date,
      notes,
      breed_ids,       
      color_ids,      
      feed_type_ids,  
      activity_type_ids 
    );
    res.json(horses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// Mise à jour du stable_id d'un cheval
router.put('/horse/:id/stable',middlewares.authMiddleware, async (req, res) => {
  const horseId = req.params.id;
  const { stableId } = req.body;

  if (!stableId) {
    return res.status(400).json({ error: 'Le stableId est requis' });
  }

  try {
    const updatedHorse = await Horse.putHorseStableByHorseId(horseId, stableId);
    res.json({ message: 'Stable ID mis à jour', horse: updatedHorse });
  } catch (err) {
    if (err.message === 'Cheval non trouvé') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mise à jour du stable_id d'un cheval
router.put('/horse/:id/notes',middlewares.authMiddleware, async (req, res) => {
  const horseId = req.params.id;
  const { notes } = req.body;

  if (!horseId) {
    return res.status(400).json({ error: 'Le horseId est requis' });
  }

  try {
    const updatedHorse = await Horse.putHorseNotesByHorseId(horseId, notes);
    res.json({ message: 'Note mis à jour', horse: updatedHorse });
  } catch (err) {
    if (err.message === 'Cheval non trouvé') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


router.put('/horse/:id/users',middlewares.authMiddleware, async (req, res) => {
  const horseId = req.params.id;
  const { userIds } = req.body; 

  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds doit être un tableau' });
  }

  try {
    await Horse.updateUsersForHorse(horseId, userIds);
    res.json({ message: 'Liste des utilisateurs mise à jour pour le cheval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});




// DELETE /api/horses/:id
router.delete('/horse/:id',middlewares.authMiddleware, async (req, res) => {
  try {
    await Horse.deleteHorse(req.params.id);
    res.json({ message: 'Cheval supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;