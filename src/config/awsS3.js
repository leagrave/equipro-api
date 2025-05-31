const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,       // à configurer dans ton .env
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // idem
  region: process.env.AWS_REGION,                   // région de ton bucket S3
});

module.exports = s3;
