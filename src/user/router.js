const express = require('express');
const router = express.Router();
const User = require('./service'); 

// GET /api/users - Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users/:id - Récupérer un utilisateur par id
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { email, password, role_id } = req.body;

  if (!email || !role_id) {
    return res.status(400).json({ error: 'Email et role_id sont requis' });
  }

  try {
    const updatedUser = await User.updateUser(email, password, role_id, id);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await User.deleteUser(id);
    res.json(result);
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
