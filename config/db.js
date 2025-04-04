

const { Pool } = require('pg');

// Assure-toi que DATABASE_URL est correctement définie dans ton environnement
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Utilise la variable d'environnement
  ssl: {
    rejectUnauthorized: false // nécessaire pour les connexions sécurisées sur Render
  }
});

pool.connect()
  .then(() => console.log('Connexion à la base de données réussie'))
  .catch((err) => console.error('Erreur de connexion à la base de données', err));

module.exports = pool;
