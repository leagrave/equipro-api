const axios = require('axios');
require("dotenv").config();
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const urlsToCheck = [
  process.env.FRONT_URL,
  process.env.BACK_URL,
  'http://localhost:3000'
];

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,                      // true pour 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Fonction pour envoyer le mail
async function sendAlert(url, status) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL,
    subject: `Alerte disponibilité: ${url}`,
    text: `${url} est indisponible: ${status}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Mail envoyé pour ${url}`);
  } catch (err) {
    console.error(`Erreur envoi mail pour ${url}:`, err);
  }
}

// Vérification avec retry pour BACK_URL
async function checkUrlWithRetry(url, retries = 3, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url);
      return res.status;
    } catch (err) {
      if (i < retries - 1) {
        console.log(`Échec ${i+1} pour ${url}, nouvelle tentative dans ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// Vérifie chaque URL
async function checkServices() {
  for (const url of urlsToCheck) {
    try {
      let status;
      if (url === process.env.BACK_URL) {
        // Retry pour BACK_URL
        status = await checkUrlWithRetry(url);
      } else {
        const response = await axios.get(url);
        status = response.status;
      }
      console.log(`${url} disponible (status ${status})`);
    } catch (err) {
      const status = err.response ? err.response.status : err.message;
      console.error(`${url} indisponible: ${status}`);
      await sendAlert(url, status);
    }
  }
}

// Planification 3 fois par jour à 8h, 14h et 20h
cron.schedule('0 8,14,20 * * *', async () => {
  console.log('Vérification programmée...');
  await checkServices();
});

// Optionnel : vérifier toutes les 5 minutes pour développement/local
setInterval(checkServices, 300000);

// Lancer immédiatement au démarrage
checkServices();
