const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialisation du client S3 (v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Upload vers S3 avec AWS SDK v3
async function uploadFileToS3(fileBuffer, fileName, mimeType) {
  const key = `${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, s3Url };
}

// ✅ Enregistrement dans PostgreSQL avec association utilisateurs
async function saveFileMetaToDb(originalName, s3Url, mimeType, userIds = []) {
  const fileId = uuidv4();

  const result = await pool.query(
    `INSERT INTO files (id, nom, url_file, mime_type)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [fileId, originalName, s3Url, mimeType]
  );

  for (const userId of userIds) {
    await pool.query(
      `INSERT INTO files_users (file_id, user_id)
       VALUES ($1, $2)`,
      [fileId, userId]
    );
  }

  return result.rows[0];
}

// ✅ Génération d’une URL signée à partir de la "key"
async function getSignedUrlFromKey(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// ✅ Récupérer les fichiers associés à un utilisateur
async function getFilesForUser(userId) {
  const result = await pool.query(
    `SELECT f.*, 
            RIGHT(f.url_file, POSITION('/' IN REVERSE(f.url_file)) - 1) AS key
     FROM files f
     JOIN files_users fu ON f.id = fu.file_id
     WHERE fu.user_id = $1`,
    [userId]
  );

  const filesWithSignedUrls = await Promise.all(
    result.rows.map(async (file) => {
      const signedUrl = await getSignedUrlFromKey(file.key);
      return {
        id: file.id,
        nom: file.nom,
        mime_type: file.mime_type,
        created_at: file.created_at,
        signedUrl,
        key: file.key,
      };
    })
  );

  return filesWithSignedUrls;
}

module.exports = {
  uploadFileToS3,
  saveFileMetaToDb,
  getSignedUrlFromKey,
  getFilesForUser,
};
