const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { analyzeMedicalReport } = require('./analysisService'); // <--- Import the Brain

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

// multer in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

const handleUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    console.log(`📁 Uploading file: ${fileName}`);

    const bucket = storage.bucket(bucketName);
    const remoteFile = bucket.file(fileName);

    // 1. Upload to GCS
    await remoteFile.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    const gcsUri = `gs://${bucketName}/${fileName}`;
    console.log(`✅ File saved to GCS: ${gcsUri}`);

    // 2. Trigger AI Analysis
    console.log('🤖 Sending to AI Analysis Service...');
    const aiResult = await analyzeMedicalReport(gcsUri);

    // 3. Return Results to Frontend
    return res.status(200).json({
      status: 'success',
      filePath: gcsUri,
      ...aiResult // This spreads the score, bmi, etc. into the response
    });

  } catch (err) {
    console.error('🔥 Error processing upload:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Analysis failed', 
      error: err.message 
    });
  }
};

module.exports = { upload, handleUpload };