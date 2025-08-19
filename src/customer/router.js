const express = require('express');
const router = express.Router();
const Customer = require('./service'); 
const middlewares = require('../securite/middlewares');

// GET /api/customers - Récupérer tous les clients
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Erreur getAllCustomers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/customers/:user_id - Récupérer un client par user_id
router.get('/customer/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const customer = await Customer.getCustomerById(user_id);
    if (!customer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Erreur getCustomerById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un client
router.post('/customer',async (req, res) => {
  const { owner_id, user_id ,phone, phone2, is_societe, societe_name, notes, mainAddress, billingAddress } = req.body;
   //mainAddress & billingAddress = { adresse, city, postal_code, country, latitude, longitude, type};
     console.log('BODY:', owner_id, user_id ,phone, phone2, is_societe, societe_name, notes, mainAddress, billingAddress);

  if (!user_id) {
    return res.status(400).json({ error: 'L\'identifiant utilisateur est obligatoire' });
  }

    if (!owner_id) {
    return res.status(400).json({ error: 'L\'identifiant du profesionnel est obligatoire' });
  }
  // if (!mainAddress || !mainAddress.address || !mainAddress.city || !mainAddress.postal_code) {
  //   return res.status(400).json({ error: 'L\'adresse principale est obligatoire (address, city, postal_code)' });
  // }

  try {
    const newCustomer = await Customer.createCustomer(
      { owner_id, user_id, phone, phone2, is_societe, societe_name, notes },
      mainAddress,
      billingAddress
    );
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/customers/:user_id - Mettre à jour un client
router.put('/customer/:id', async (req, res) => {
  const userId = req.params.id;
  const data = req.body;

  try {
    const updatedCustomer = await Customer.updateCustomer(userId, data);
    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Erreur updateCustomer:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// DELETE /api/customers/:user_id - Supprimer un client
router.delete('/customer/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await Customer.deleteCustomer(user_id);
    res.json(result);
  } catch (error) {
    console.error('Erreur deleteCustomer:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
