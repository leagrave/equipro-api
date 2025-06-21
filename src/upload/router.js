const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { uploadFileToS3, saveFileMetaToDb, getSignedUrlFromKey, getFilesForUser  } = require('./service');

const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });

    const { originalname, mimetype, buffer } = req.file;

    // Récupérer userId(s) depuis le body
    // Si tu envoies un seul userId en string:
    let userIds = [];
    if (req.body.userId) {
      if (Array.isArray(req.body.userId)) {
        userIds = req.body.userId;
      } else {
        userIds = [req.body.userId];
      }
    }

    const { key, s3Url } = await uploadFileToS3(buffer, originalname, mimetype);
    
    // Attention à bien utiliser le bon nom de champ pour URL dans ta table (ici url_file)
    const fileRecord = await saveFileMetaToDb(originalname, s3Url, mimetype, userIds);

    res.status(201).json({ message: 'Fichier uploadé avec succès', fichier: fileRecord });
  } catch (err) {
    console.error('Erreur upload :', err);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
  }
});




router.get('/download/:key', async (req, res) => {
  try {
    const signedUrl = await getSignedUrlFromKey(req.params.key);
    res.json({ url: signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération du lien signé' });
  }
});



router.get('/files/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await getFilesForUser(userId);
    res.json(files);
    console.log("test fonctionne")
  } catch (err) {
    console.error('Erreur récupération fichiers utilisateur :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router;
