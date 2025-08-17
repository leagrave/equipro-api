const fs = require('fs');
const path = require('path');

const [,, version, type, message] = process.argv;

const filePath = path.join(__dirname, './version.json');

// Lire le fichier existant
let data = [];
if (fs.existsSync(filePath)) {
  data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Chercher si la version existe déjà
let versionEntry = data.find(v => v.version === version);
if (!versionEntry) {
  versionEntry = { 
    version: version, 
    date: new Date().toISOString().split('T')[0],
    auteur: "CI/CD",
    description: message || "",
    type: type,
    anomalie: ""
  };
  data.push(versionEntry);
} else {
  // Mettre à jour si tu veux ajouter des logs ou modifier le type/message
  versionEntry.type = type;
  versionEntry.description = message;
}

// Réécrire le fichier
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Version ${version} mise à jour avec ${type}.`);
