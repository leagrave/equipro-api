# Application Mobile Flutter - Equipro

## Prérequis

- Node.js version LTS 20 ou supérieure
- Base de données PostgreSQL (hébergée sur Neon)
- Accès au dashboard Render.com
- AWS CLI (pour gestion du stockage S3)
- Fichier `.env` correctement configuré

## Lancement du projet

1. récupérez les dépendances :  
   ```bash
   npm install

2. lancer l'API en developpement :  
   ```bash
   npm run dev

3. lancer l'API :  
   ```bash
   npm run start

## Déploiement sur Render

1. Connectez-vous sur [Render Dashboard](https://dashboard.render.com).
2. Le déploiement est automatisé : chaque push sur les branches `main` et `develop` déclenche un build et un déploiement.
3. Configurez les variables d’environnement dans Render :  
WDATABASE_URL=
JWT_SECRET=
FIREBASE_PROJECT_ID=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

4. Vérifiez le bon fonctionnement via les logs Render.

## Gestion des fichiers PDF (AWS S3)

- Les fichiers PDF sont uploadés via l’API avec des URL signées pour un accès sécurisé et temporaire.
- Le bucket S3 est privé.
- Pour uploader manuellement :  
```bash
aws s3 cp ./myfile.pdf s3://<bucket-name>/pdfs/ --acl private
