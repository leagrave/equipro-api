require("dotenv").config();
const express = require("express");
const cors = require("cors");
const loginRoute = require("./src/login/router");
const signUpRoute = require("./src/signUp/router");
const uploadRoute = require('./src/upload/router');

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/api", loginRoute);
app.use("/api", signUpRoute);
app.use("/api", uploadRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
