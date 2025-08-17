const fs = require('fs');
const path = require('path');

// Chemins
const dataPath = path.join(__dirname, './version.json'); 
const outputPath = path.join(__dirname, '../CHANGELOG.md'); 

// Vérifier que le JSON existe
if (!fs.existsSync(dataPath)) {
    console.error('Le fichier JSON versions.json est introuvable à :', dataPath);
    process.exit(1);
}

// Lire le JSON
let versions;
try {
    versions = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (err) {
    console.error('Erreur lors de la lecture du JSON :', err);
    process.exit(1);
}

// Vérifier que des versions sont présentes
if (!Array.isArray(versions) || versions.length === 0) {
    console.error('Le fichier JSON ne contient aucune version.');
    process.exit(1);
}

// Lire le contenu existant du changelog
let existingContent = '';
if (fs.existsSync(outputPath)) {
    existingContent = fs.readFileSync(outputPath, 'utf8');
}

// Générer le tableau Markdown
let newEntries = '';
versions.forEach(v => {
    newEntries += `| ${v.version} | ${v.date} | ${v.auteur} | ${v.description} | ${v.type} | ${v.anomalie || '-'} |\n`;
});

// Ajouter l’en-tête si le fichier est vide
if (!existingContent) {
    newEntries = '# Journal de versions\n\n' +
                 '| Version | Date | Auteur | Description | Type | Anomalie |\n' +
                 '|---------|------|-------|------------|------|----------|\n' + newEntries;
} else {
    newEntries = '\n' + newEntries; // ajout à la fin
}

// Écrire dans le fichier
try {
    fs.writeFileSync(outputPath, existingContent + newEntries, 'utf8');
    console.log('Journal de versions mis à jour avec succès !');
} catch (err) {
    console.error('Erreur lors de l’écriture du fichier changelog :', err);
}
