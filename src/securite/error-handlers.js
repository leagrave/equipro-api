const { createLogger, format, transports } = require("winston");
const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: "error.log", level: "error" }), new transports.Console()],
});

const notFoundHandler = (req, res, next) => {
  router.post('/userCreate', async (req, res) => {
    console.log('>>> ROUTE /userCreate appelée');
    console.log('BODY:', req.body);

  });

  console.warn(`Ressource non trouvée : ${req.originalUrl}`);
  res.status(404).json({ error: "Ressource introuvable" });
};

const errorHandler = (err, req, res, next) => {
  logger.error({ msg: err.message, stack: err.stack, path: req.originalUrl, user: req.user?.id });
  const status = err.status || 500;
  const message = status === 500 ? "Une erreur est survenue" : err.message;
  res.status(status).json({ error: message });
};

module.exports = { errorHandler, notFoundHandler, logger };
