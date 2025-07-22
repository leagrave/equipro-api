require("dotenv").config();
const express = require("express");
const cors = require("cors");
const loginRoute = require("./src/login/router");
const signUpRoute = require("./src/signUp/router");
const userRoute = require('./src/user/router');
const uploadRoute = require('./src/upload/router');
const agendaRoute = require('./src/agenda/router');
const customerRoute = require('./src/customer/router');
const profesionnalRoute = require('./src/professional/router');
const horseRoute = require('./src/horse/router');
const adressesRoute = require('./src/adresse/router');
const soinsRoute = require('./src/soins/router');
const notesRoute = require('./src/notes/router');

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/api", loginRoute);
app.use("/api", signUpRoute);
app.use("/api", userRoute);
app.use("/api", uploadRoute);
app.use("/api", agendaRoute);
app.use("/api", customerRoute);
app.use("/api", profesionnalRoute);
app.use("/api", horseRoute);
app.use("/api", adressesRoute);
app.use("/api", soinsRoute);
app.use("/api", notesRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
