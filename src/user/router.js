const express = require('express');
const router = express.Router();
const User = require('./service'); 
const middlewares = require('../securite/middlewares');

// GET /api/users - Crée  un utilisateur
router.post('/userCreate',middlewares.authMiddleware, async (req, res) => {
  const { email, password, first_name, last_name, professional } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const user = await User.createUser(email, password, first_name, last_name, professional);
    res.status(201).json(user);
  } catch (error) {
    console.error('Erreur lors de la création de l utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// GET /api/users - Récupérer tous les utilisateurs
router.get('/users',middlewares.authMiddleware, async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users/:id - Récupérer un utilisateur par id
router.get('/user/pro/:id', middlewares.authMiddleware, async (req, res) => {
  const requestedUserId = req.params.id;
  const authUserId = req.user.id;

  if (authUserId !== requestedUserId) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const user = await User.getUserProById(requestedUserId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users/:id - Récupérer un utilisateur par id
router.get('/user/:id',middlewares.authMiddleware, async (req, res) => {
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
router.put('/user/:id',middlewares.authMiddleware, async (req, res) => {
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



// PUT /user/all/:id
router.put('/user/all/:id',middlewares.authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const data = req.body;

  try {
    await User.updateUserAndRole(userId, data);
    res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur PUT /user/all/:id :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l’utilisateur' });
  }
});



// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/user/:id',middlewares.authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await User.deleteUser(id);
    res.json(result);
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// verif email
router.get('/user/email/checkEmail',middlewares.authMiddleware, async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    const exists = await User.checkEmailExists(email);
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Erreur vérif email :', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router;
