const express = require('express');
const router = express.Router();
const stableService = require('./service');
const middlewares = require('../middlewares');

// POST /stables/by-owner
router.post('/stable',middlewares.authMiddleware, async (req, res) => {

  try {
    const stables = await stableService.postStables(req.body);
    res.json(stables);
  } catch (error) {
    console.error('Erreur lors de la création de l ecurie:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des écuries.' });
  }
});

// POST /stables/by-owner ajout d'une ecurie + dans la liste d un pro 
router.post('/stables/by-owner/:user_id',middlewares.authMiddleware, async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const stables = await stableService.postStablesByUserId(user_id, req.body);
    res.json(stables);
  } catch (error) {
    console.error('Erreur getStablesByOwner:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des écuries.' });
  }
});

// POST ajout une ecurie dans la liste d un pro 
router.post('/stables/:user_id',middlewares.authMiddleware, async (req, res) => {
  const { owner_user_id } = req.body;
  const { user_id } = req.params;

  if (!owner_user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const stables = await stableService.postUserStableLink(owner_user_id,user_id);
    res.json(stables);
  } catch (error) {
    console.error('Erreur getStablesByOwner:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des écuries.' });
  }
});

// GET /stables/:id
router.get('/stables/:id',middlewares.authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const stable = await stableService.getStableById(id);
    if (!stable) {
      return res.status(404).json({ error: 'Écurie non trouvée' });
    }
    res.json(stable);
  } catch (error) {
    console.error('Erreur GET stable:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /stables/owner/:owner_user_id
router.get('/stables/owner/:owner_user_id',middlewares.authMiddleware, async (req, res) => {
  const { owner_user_id } = req.params;

  try {
    const stables = await stableService.getStablesByOwnerId(owner_user_id);

    if (!stables || stables.length === 0) {
      return res.status(404).json({ error: 'Aucune écurie trouvée pour ce propriétaire' });
    }

    res.json(stables);
  } catch (error) {
    console.error('Erreur GET stables par owner_user_id :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des écuries.' });
  }
});

// GET /stables/by-user/:user_id 
router.get('/stable/by-user/:user_id',middlewares.authMiddleware, async (req, res) => {
  const { user_id } = req.params;

  try {
    const stables = await stableService.getStablesByUserId(user_id);
    res.json(stables);
  } catch (error) {
    console.error('Erreur GET stables by user_id:', error);
    res.status(500).json({ error: "Erreur lors de la récupération des écuries de l'utilisateur" });
  }
});

router.get('/user_stable/:owner_user_id/stables',middlewares.authMiddleware, async (req, res) => {
  const { owner_user_id } = req.params;

  if (!owner_user_id) {
    return res.status(400).json({ error: 'owner_user_id requis' });
  }

  try {
    const stables = await stableService.getStablesByOwnerUserId(owner_user_id);
    res.json(stables);
  } catch (error) {
    console.error('Erreur lors de la récupération des écuries :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des écuries.' });
  }
});



// PUT /stables/:id
router.put('/stable/:id',middlewares.authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, phone2, address_id, user_id } = req.body;

  try {
    const updated = await stableService.updateStable(id, {
      name,
      phone,
      phone2,
      address_id,
      user_id,
    });
    res.json(updated);
  } catch (error) {
    console.error('Erreur PUT stable:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE /stables/:id
router.delete('/stable/:id',middlewares.authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    await stableService.deleteStable(id);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Erreur DELETE stable:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});


module.exports = router;
