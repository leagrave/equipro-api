require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Sentry = require("@sentry/node");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");

// Import des routes
const loginRoute = require("./src/login/router");
const signUpRoute = require("./src/signUp/router");
const userRoute = require("./src/user/router");
const uploadRoute = require("./src/upload/router");
const agendaRoute = require("./src/agenda/router");
const customerRoute = require("./src/customer/router");
const profesionalRoute = require("./src/professional/router");
const horseRoute = require("./src/horse/router");
const adressesRoute = require("./src/adresse/router");
const soinsRoute = require("./src/soins/router");
const notesRoute = require("./src/notes/router");
const ecuriesRoute = require("./src/ecurie/router");
const interventionRoute = require("./src/intervention/router");

const app = express();
const allowedOrigins = ["https://equipro.onrender.com"];

// ======================
// Sentry
// ======================
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
});

// ======================
// Middleware sécurité
// ======================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(xss());


// ======================
// CORS
// ======================
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS non autorisé"));
    }
  }
}));

// ======================
// JSON Parser
// ======================
app.use(express.json({ limit: "10kb" })); // Limite la taille du payload

// ======================
// HTTPS Redirection (prod only)
// ======================
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.header("x-forwarded-proto") !== "https") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  next();
});

// ======================
// Rate Limiter
// ======================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: "Trop de tentatives de connexion, réessayez plus tard",
  standardHeaders: true,
  legacyHeaders: false,
});
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 100, // max 100 requêtes/min
  message: "Trop de requêtes, réessayez plus tard",
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer limiter global à toutes les routes
app.use(globalLimiter);

// ======================
// Routes API
// ======================
app.get("/", (req, res) => res.send("Hello world!"));
app.use("/api", loginLimiter, loginRoute);
app.use("/api", signUpRoute);
app.use("/api", userRoute);
app.use("/api", uploadRoute);
app.use("/api", agendaRoute);
app.use("/api", customerRoute);
app.use("/api", profesionalRoute);
app.use("/api", horseRoute);
app.use("/api", adressesRoute);
app.use("/api", soinsRoute);
app.use("/api", notesRoute);
app.use("/api", ecuriesRoute);
app.use("/api", interventionRoute);

// ======================
// Test Sentry
// ======================
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
Sentry.setupExpressErrorHandler(app);

// ======================
// Fallthrough Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Une erreur est survenue. Contactez le support." });
});

// ======================
// Lancement serveur
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));


// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const Sentry = require("@sentry/node");
// const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');

// const loginRoute = require("./src/login/router");
// const signUpRoute = require("./src/signUp/router");
// const userRoute = require('./src/user/router');
// const uploadRoute = require('./src/upload/router');
// const agendaRoute = require('./src/agenda/router');
// const customerRoute = require('./src/customer/router');
// const profesionnalRoute = require('./src/professional/router');
// const horseRoute = require('./src/horse/router');
// const adressesRoute = require('./src/adresse/router');
// const soinsRoute = require('./src/soins/router');
// const notesRoute = require('./src/notes/router');
// const ecuriesRoute = require('./src/ecurie/router');
// const interventionRoute = require('./src/intervention/router');

// const allowedOrigins = ['https://equipro.onrender.com'];
// const app = express();

// // Initialise Sentry
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   sendDefaultPii: true,
// });

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('CORS non autorisé'));
//     }
//   }
// }));
// app.use(express.json());
// app.use(helmet());

// app.use((req, res, next) => {
//     if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
//       return res.redirect(`https://${req.header('host')}${req.url}`);
//     }
// });

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'"],
//         objectSrc: ["'none'"],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );


// // Limiter les tentatives de connexion
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // max 5 tentatives
//   message: "Trop de tentatives de connexion, réessayez plus tard",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // Routes API
// app.get("/", function rootHandler(req, res) {
//   res.end("Hello world!");
// });

// app.use("/api/login", loginLimiter);
// app.use("/api", loginRoute);
// app.use("/api", signUpRoute);
// app.use("/api", userRoute);
// app.use("/api", uploadRoute);
// app.use("/api", agendaRoute);
// app.use("/api", customerRoute);
// app.use("/api", profesionnalRoute);
// app.use("/api", horseRoute);
// app.use("/api", adressesRoute);
// app.use("/api", soinsRoute);
// app.use("/api", notesRoute);
// app.use("/api", ecuriesRoute);
// app.use("/api", interventionRoute);

// app.use("/api/login", loginRoute);
// app.use("/api/signUp", signUpRoute);
// app.use("/api/user", userRoute);
// app.use("/api/upload", uploadRoute);
// app.use("/api/agenda", agendaRoute);
// app.use("/api/customer", customerRoute);
// app.use("/api/professional", profesionnalRoute);
// app.use("/api/horse", horseRoute);
// app.use("/api/adresse", adressesRoute);
// app.use("/api/soins", soinsRoute);
// app.use("/api/notes", notesRoute);
// app.use("/api/ecurie", ecuriesRoute);
// app.use("/api/intervention", interventionRoute);


// app.get("/debug-sentry", function mainHandler(req, res) {
//   throw new Error("My first Sentry error!");
// });
// Sentry.setupExpressErrorHandler(app);

// // Optional fallthrough error handler
// app.use(function onError(err, req, res, next) {
//   // The error id is attached to `res.sentry` to be returned
//   // and optionally displayed to the user for support.
//   res.statusCode = 500;
//   res.end(res.sentry + "\n");
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });