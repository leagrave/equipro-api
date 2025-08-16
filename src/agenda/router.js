const express = require('express');
const router = express.Router();
const agendaService = require('../agenda/service');
const middlewares = require('../securite/middlewares');

// Récupération de l’agenda d’un utilisateur
router.get('/agenda/:userId',middlewares.authMiddleware, async (req, res) => {
    try {
        const agenda = await agendaService.getAgenda(req.params.userId);
        res.json(agenda);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la récupération de l’agenda' });
    }
});

// Récupération des infos d’un utilisateur
router.get('/agendaAll/:userId',middlewares.authMiddleware, async (req, res) => {

    try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Accès refusé pour cet utilisateur" });
    }
        const agenda = await agendaService.getAllAgenda(req.params.userId);
        res.json(agenda);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la récupération de l’agenda' });
    }
});

// Ajout d’un contact à l’agenda
router.post('/agenda/:userId/:contactId',middlewares.authMiddleware, async (req, res) => {
    try {
        const added = await agendaService.addContactToAgenda(req.params.userId, req.params.contactId);
        res.status(201).json(added);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de l’ajout du contact' });
    }
});

// Suppression d’un contact de l’agenda
router.delete('/agenda/:userId/:contactId',middlewares.authMiddleware, async (req, res) => {
    try {
        const result = await agendaService.removeContactFromAgenda(req.params.userId, req.params.contactId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la suppression du contact' });
    }
});

module.exports = router;
