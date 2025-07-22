// routes/customerProfessionnalNote.router.js
const express = require('express');
const router = express.Router();
const Notes = require('./service');

// Créer une note
router.post('/note', async (req, res) => {
  const { customer_id, professionals_id, notes } = req.body;
  console.log(customer_id, professionals_id, notes )

  try {
    const note = await Notes.upsertNote({ customer_id, professionals_id, notes });
    res.json(note);
  } catch (err) {
    console.error('Erreur upsert note :', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});


// Créer une note
// router.post('/note', async (req, res) => {
//   const { customer_id, professionals_id, notes } = req.body;
//   if (!customer_id || !professionals_id) {
//     return res.status(400).json({ error: 'Champs requis manquants.' });
//   }

//   try {
//     const createdNote = await Notes.createNote(customer_id, professionals_id, notes || '');
//     res.status(201).json(createdNote);
//   } catch (err) {
//     console.error('Erreur lors de la création :', err);
//     res.status(500).json({ error: 'Erreur serveur lors de la création de la note.' });
//   }
// });

// Récupérer une note par customer_id et professionals_id
router.get('/note/by-user/:customerId/:proId', async (req, res) => {
  const { customerId, proId } = req.params;

  try {
    const note = await Notes.getNoteByCustomerAndProfessional(customerId, proId);
        if (!note) {
      return res.status(200).json(null); 
    }

    res.json(note);
  } catch (err) {
    console.error('Erreur lors de la récupération :', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Récupérer une note par ID
router.get('/note/by-id/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const note = await Notes.getNoteById(id);
    if (!note) {
      return res.status(200).json(null); 
    }

    res.json(note);
  } catch (err) {
    console.error('Erreur récupération note par ID :', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Modifier une note
router.put('/note/:id', async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const updatedNote = await Notes.updateNote(id, notes);
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note non trouvée.' });
    }
    res.json(updatedNote);
  } catch (err) {
    console.error('Erreur lors de la mise à jour :', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

// Supprimer une note
router.delete('/note/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNote = await Notes.deleteNote(id);
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note non trouvée.' });
    }
    res.json({ message: 'Note supprimée.', deletedNote });
  } catch (err) {
    console.error('Erreur lors de la suppression :', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

module.exports = router;
