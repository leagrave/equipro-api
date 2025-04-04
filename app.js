require("dotenv").config();
const express = require("express");
const cors = require("cors");
const loginRoute = require("./login/router");

const app = express();

app.use(express.json());
app.use(cors());

// Routes d'authentification
app.use("/api/auth", loginRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
