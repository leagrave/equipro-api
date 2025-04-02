
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Utilise Neon avec une URL PostgreSQL
  ssl: {
    rejectUnauthorized: false, // Pour Neon, selon la configuration SSL
  },
});

module.exports = pool;
