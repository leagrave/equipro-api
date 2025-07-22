const express = require('express');
const router = express.Router();
const Professional = require('./service');

// Tous les professionnels
router.get('/professionals', async (req, res) => {
  try {
    const professionals = await Professional.getAllProfessionals();
    res.json(professionals);
  } catch (error) {
    console.error('Erreur getAllProfessionals:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Professionnel par ID
router.get('/professional/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const professional = await Professional.getProfessionalById(id);
    if (!professional) {
      return res.status(404).json({ error: 'Professionnel non trouvé' });
    }
    res.json(professional);
  } catch (error) {
    console.error('Erreur getProfessionalById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Professionnel type
router.get('/professionalType', async (req, res) => {
  try {
    const professional = await Professional.getAllProfessionalsTypes();
    if (!professional) {
      return res.status(404).json({ error: 'Professionnel non trouvé' });
    }
    res.json(professional);
  } catch (error) {
    console.error('Erreur de récupération des types de professions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un professionnel
router.post('/professional', async (req, res) => {
  const { phone, phone2, siret_number, societe_name, professional_types_id, is_verified, address } = req.body;

  if (!siret_number) {
    return res.status(400).json({ error: 'Le numéro SIRET est obligatoire' });
  }

    if (!address || !address.address || !address.city || !address.postal_code) {
    return res.status(400).json({ error: 'L\'adresse complète est obligatoire (address, city, postal_code)' });
  }

  try {
    const newProfessional = await Professional.createProfessional(
      { phone, phone2, siret_number, societe_name, professional_types_id, is_verified },
      address
    );
    res.status(201).json(newProfessional);
  } catch (error) {
    console.error('Erreur createProfessional:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un professionnel
router.put('/professional/:id', async (req, res) => {
  const { id } = req.params;
  const { phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified } = req.body;

  if (!siret_number) {
    return res.status(400).json({ error: 'Le numéro SIRET est obligatoire' });
  }

  try {
    const updatedProfessional = await Professional.updateProfessional(id, phone, phone2, address_id, siret_number, societe_name, professional_types_id, is_verified);
    if (!updatedProfessional) {
      return res.status(404).json({ error: 'Professionnel non trouvé' });
    }
    res.json(updatedProfessional);
  } catch (error) {
    console.error('Erreur updateProfessional:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un professionnel
router.delete('/professional/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Professional.deleteProfessional(id);
    res.json(result);
  } catch (error) {
    console.error('Erreur deleteProfessional:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
