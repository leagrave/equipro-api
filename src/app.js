require("dotenv").config();

const http = require("http");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const requestHandler = async (req, res) => {
  const result = await sql`SELECT version()`;
  const { version } = result[0];
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(version);
};

http.createServer(requestHandler).listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});


// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const sql = require('./config/db');
// const userRoutes = require('./routes/user.routes');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Vérifier la connexion à la base de données
// app.get('/db-test', async (req, res) => {
//   try {
//     const result = await sql`SELECT version()`;
//     res.json({ version: result[0].version });
//   } catch (error) {
//     res.status(500).json({ message: 'Erreur de connexion à la DB', error });
//   }
// });

// // Routes utilisateur
// app.use('/api', userRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
// });
