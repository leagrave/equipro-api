const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Créer un nouvel utilisateur
router.post('/', async (req, res) => {
  try {
    const { email, password, role_id } = req.body;
    const result = await pool.query(
      'INSERT INTO users (email, password, role_id) VALUES ($1, $2, $3) RETURNING *',
      [email, password, role_id]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer un utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role_id } = req.body;
    const result = await pool.query(
      'UPDATE users SET email = $1, password = $2, role_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [email, password, role_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    return res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
