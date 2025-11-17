const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

// Initialize Google Cloud Storage client
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

// Use in-memory storage with multer
const upload = multer({ storage: multer.memoryStorage() });

const handleUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      console.log('⚠️ No file uploaded in the request.');
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    console.log(`📁 Uploading file: ${fileName} → bucket: ${bucketName}`);

    const blob = storage.bucket(bucketName).file(fileName);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', err => {
      console.error('❌ Error while uploading to Cloud Storage:', err);
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', message: 'Upload failed', error: err.message });
      }
    });

    blobStream.on('finish', () => {
      const filePath = `gs://${bucketName}/${fileName}`;
      console.log(`✅ Upload successful: ${filePath}`);
      if (!res.headersSent) {
        res.status(200).json({ status: 'uploaded', filePath });
      }
    });

    // Start the upload stream
    blobStream.end(file.buffer);

    // Safety net in case 'finish' doesn't fire
    setTimeout(() => {
      if (!res.headersSent) {
        console.warn('⚠️ Upload fallback triggered: no finish event after 5 seconds.');
        res.status(200).json({
          status: 'timeout',
          message: 'Upload may have completed, but no response was returned in time.',
        });
      }
    }, 5000);

  } catch (err) {
    console.error('🔥 Unexpected error in handleUpload:', err);
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: 'Internal server error', error: err.message });
    }
  }
};

module.exports = { upload, handleUpload };
