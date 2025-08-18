const fs = require('fs');
const path = require('path');

const outdatedPath = path.join(__dirname, './package-outdated.json'); 
const changelogPath = path.join(__dirname, '..', 'CHANGELOG_NODE.md');

let jsonData;

try {
  // Lire le fichier en UTF-8 et retirer le BOM éventuel
  let data = fs.readFileSync(outdatedPath, 'utf8');
  data = data.replace(/^\uFEFF/, '').trim();

  jsonData = JSON.parse(data);
  console.log('JSON Node chargé avec succès !');
} catch (err) {
  console.error('Erreur lors de la lecture ou du parsing de outdated_node.json :', err);
  process.exit(1);
}

// Lire le contenu existant pour ne pas l'écraser
let existingChangelog = '';
if (fs.existsSync(changelogPath)) {
  existingChangelog = fs.readFileSync(changelogPath, 'utf8');
}

let markdown = existingChangelog + '\n\n'; 

markdown += '# Changelog des packages Node upgradable\n\n';
markdown += '| Package | Version actuelle | Version souhaitée | Dernière version |\n';
markdown += '|---------|-----------------|-----------------|----------------|\n';

for (const [pkgName, pkgInfo] of Object.entries(jsonData)) {
  const current = pkgInfo.current || '-';
  const wanted = pkgInfo.wanted || '-';
  const latest = pkgInfo.latest || '-';

  markdown += `| ${pkgName} | ${current} | ${wanted} | ${latest} |\n`;
}

try {
  fs.writeFileSync(changelogPath, markdown, 'utf8');
  console.log(`Changelog Node généré dans ${changelogPath}`);
} catch (err) {
  console.error('Erreur lors de l’écriture du changelog Node :', err);
  process.exit(1);
}
