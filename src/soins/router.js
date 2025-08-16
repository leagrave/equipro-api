const express = require('express');
const router = express.Router();
const Soins = require('./service'); 
const middlewares = require('../securite/middlewares');


// Pro → infos d’un client
router.get('/pro/:professionalId/customer/:customerId', middlewares.authMiddleware, middlewares.verifyRole(['pro']), async (req, res) => {
  const { professionalId, customerId } = req.params;
  try {
    const data = await Soins.getCustomerVisitByProfessional(professionalId, customerId);

    if (!data) {
      return res.status(200).json(null); 
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Pro → infos dernier rendez-vous d’un client
router.get('/lastVisit/pro/:professionalId/customer/:customerId',middlewares.authMiddleware,middlewares.verifyRole(['pro', 'user']), async (req, res) => {
  const { professionalId, customerId } = req.params;

  try {
    const data = await Soins.getCustomerLastVisitByProfessional(professionalId, customerId);

    if (!data) {
      return res.status(200).json(null); 
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Pro → historique de tous ses clients
router.get('/pro/:professionalId/history',middlewares.authMiddleware,middlewares.verifyRole(['pro']), async (req, res) => {
  const { professionalId } = req.params;
  try {
    const data = await Soins.getAllCustomerVisitsByProfessional(professionalId);
    if (!data) {
      return res.status(200).json(null); 
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Client → infos sur les pros + dates
router.get('/customer/:customerId/professionals',middlewares.authMiddleware, async (req, res) => {
  const { customerId } = req.params;
  try {
    const data = await Soins.getProfessionalInfoByCustomer(customerId);
    if (!data) {
      return res.status(200).json(null); 
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Client → dernier rdv tous pros confondus
router.get('/customer/:customerId/last-visit',middlewares.authMiddleware, async (req, res) => {
  const { customerId } = req.params;
  try {
    const data = await Soins.getLastVisitByCustomer(customerId);

    if (!data) {
      return res.status(200).json(null); 
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
