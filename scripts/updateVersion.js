const fs = require('fs');
const path = require('path');

// Récupérer les infos depuis les arguments
const [,, version, type, message] = process.argv; 
// type peut être 'test', 'log', 'anomalie', message = description

const filePath = path.join(__dirname, './version.json');

// Lire le fichier existant ou créer la structure de base
let data = { versions: [] };
if (fs.existsSync(filePath)) {
  data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Chercher si la version existe déjà
let versionEntry = data.versions.find(v => v.version === version);
if (!versionEntry) {
  versionEntry = { 
    version: version, 
    date: new Date().toISOString().split('T')[0], 
    logs: [] 
  };
  data.versions.push(versionEntry);
}

// Ajouter la nouvelle entrée
versionEntry.logs.push({
  timestamp: new Date().toISOString(),
  type: type,
  message: message
});

// Réécrire le fichier
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Version ${version} mise à jour avec un nouveau ${type}.`);
