const express = require('express');
const router = express.Router();
const invoiceService = require('./service');
const middlewares = require('../securite/middlewares');


// POST -> créer une facture
router.post("/facture/file",  async (req, res) => {
    console.log("Création d'une facture avec les données :", req.body);
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Erreur création facture :", error);
    res.status(500).json({ error: "Impossible de créer la facture" });
  }
});

// GET -> factures d’un professionnel
router.get("/factures/pro/:professionalId",middlewares.authMiddleware,  async (req, res) => {
  try {
    const invoices = await invoiceService.getInvoicesByProfessional(
      req.params.professionalId
    );
    res.json(invoices);
  } catch (error) {
    console.error("Erreur récupération factures pro :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET -> factures d’un utilisateur
router.get("/factures/user/:userId",middlewares.authMiddleware, async (req, res) => {
  console.log(req.params.userId)
  try {
    const invoices = await invoiceService.getInvoicesByUser(
      req.params.userId
    );
    res.json(invoices);
  } catch (error) {
    console.error("Erreur récupération factures user :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET -> factures d’un cheval
router.get("/factures/horse/:horseId",middlewares.authMiddleware, async (req, res) => {
  try {
    const invoices = await invoiceService.getInvoicesByHorse(
      req.params.horseId
    );
    res.json(invoices);
  } catch (error) {
    console.error("Erreur récupération factures cheval :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
