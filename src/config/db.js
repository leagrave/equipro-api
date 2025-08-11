

const { Pool } = require('pg');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false // nécessaire pour les connexions sécurisées sur Render
  },
  //idleTimeoutMillis: 10000, // 10 secondes (tu peux adapter)
  connectionTimeoutMillis: 2000,
});

pool.connect()
  .then(() => console.log('Connexion à la base de données réussie'))
  .catch((err) => console.error('Erreur de connexion à la base de données', err));

module.exports = pool;
