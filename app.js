require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

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
const invoiceRoute = require("./src/invoice/router");

const Sentry = require("@sentry/node");
const compression = require("compression");
//const helmet = require("helmet");
const morgan = require("morgan");

const { errorHandler, notFoundHandler } = require("./src/securite/error-handlers");
const { authLimiter, globalLimiter } = require("./src/securite/rate-limiters");


app.use(express.json());

// ======================
// Sentry
// ======================
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0, 
});

// // -------- Security headers (Helmet + CSP) ----------
// app.disable("x-powered-by");
// app.use(helmet({
//   contentSecurityPolicy: {
//     useDefaults: true,
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'"],
//       objectSrc: ["'none'"],
//       baseUri: ["'self'"],
//       upgradeInsecureRequests: [],
//     },
//   },
//   referrerPolicy: { policy: "no-referrer" },
//   crossOriginResourcePolicy: { policy: "same-origin" },
//   crossOriginEmbedderPolicy: false, // selon besoins front
// }));

// // -------- CORS strict ----------

// const allowedOrigins = [process.env.FRONT_URL, "http://localhost:4200", "http://localhost:3000","http://localhost:3000/api", undefined];

// app.use(cors({
//   origin: (origin, cb) => {
//     console.log('CORS origin:', origin); // Ajoute ce log pour debug
//     if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
//     cb(new Error("CORS non autorisé"));
//   },
//   methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
//   credentials: true,
// }));

app.use(cors());
// // -------- HTTPS redirect (prod) ----------
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// // -------- Body parser & limites ----------
// app.use(express.json({ limit: "2mb" })); 
// app.use(compression());

// // // -------- Logs HTTP (morgan) ----------
//  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));


// ======================
// Routes API
// ======================

app.use(express.urlencoded({ extended: true }));
app.use("/api", loginRoute, authLimiter);
app.use("/api", signUpRoute);
app.use("/api", userRoute);
app.use("/api", horseRoute);
app.use("/api", uploadRoute);
app.use("/api", agendaRoute);
app.use("/api", customerRoute);
app.use("/api", profesionalRoute);
app.use("/api", adressesRoute);
app.use("/api", soinsRoute);
app.use("/api", notesRoute);
app.use("/api", ecuriesRoute);
app.use("/api", interventionRoute);
app.use("/api", invoiceRoute);
app.use("/test", (req, res) => {
    console.log("Test route appelée !");
    res.send("Test OK");
});

app.use(globalLimiter);
// ======================
// Test Sentry
// ======================
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
Sentry.setupExpressErrorHandler(app);

// // -------- 404 + erreurs centralisées ----------
// app.use(notFoundHandler);
// app.use(errorHandler);
// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});
// ======================
// Lancement serveur
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));


