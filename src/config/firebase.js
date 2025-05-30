const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(require("./equipro-messagerie-firebase-adminsdk-fbsvc-ff9c945d93.json")),
});

module.exports = admin;
