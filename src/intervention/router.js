const express = require('express');
const router = express.Router();
const interventionService = require('./service');

// POST
router.post('/intervention', async (req, res) => {
  try {
    const result = await interventionService.createIntervention(req.body);
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// GET by user_id
router.get('/interventions/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const list = await interventionService.getByUserId(userId);
    //console.log(list)
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération par user_id' });
  }
});

// GET by horse_id
router.get('/interventions/horse/:horseId', async (req, res) => {
  const horseId = req.params.userId;
  try {
    const list = await interventionService.getByHorseId(horseId);
           // console.log(list)
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération par horse_id' });
  }
});

// GET by pro_id
router.get('/interventions/pro/:proId', async (req, res) => {
    const proId = req.params.userId;
  try {
    const list = await interventionService.getByProId(proId);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération par pro_id' });
  }
});

// PUT
router.put('/intervention/:id', async (req, res) => {
    const id = req.params.id;
  try {
    await interventionService.updateIntervention(id, req.body);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE
router.delete('/intervention/:id', async (req, res) => {
      const id = req.params.id;
  try {
    await interventionService.deleteIntervention(id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
