require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Sentry = require("@sentry/node");

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
const ecuriesRoute = require('./src/ecurie/router');
const interventionRoute = require('./src/intervention/router');


const app = express();

// Initialise Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
});



app.use(cors());
app.use(express.json());

// Routes API
app.get("/", function rootHandler(req, res) {
  res.end("Hello world!");
});

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
app.use("/api", ecuriesRoute);
app.use("/api", interventionRoute);

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});