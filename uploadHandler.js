const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { analyzeMedicalReport } = require('./analysisService');
const { saveReport } = require('./dbService'); // <--- IMPORT THIS

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;
const upload = multer({ storage: multer.memoryStorage() });

const handleUpload = async (req, res) => {
  try {
    const file = req.file;
    // We will eventually send userId from the frontend. 
    // For now, we default to "demo-user".
    const userId = req.body.userId || 'demo-user-123'; 

    if (!file) return res.status(400).json({ status: 'error', message: 'No file' });

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const bucket = storage.bucket(bucketName);
    const remoteFile = bucket.file(fileName);

    // 1. Upload
    await remoteFile.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      resumable: false,
    });
    const gcsUri = `gs://${bucketName}/${fileName}`;

    // 2. Analyze (Gemini)
    const aiResult = await analyzeMedicalReport(gcsUri);

    // 3. SAVE TO DATABASE (New Step)
    const reportId = await saveReport(userId, {
      fileUrl: gcsUri, // Store link to file
      fileName: file.originalname,
      ...aiResult
    });

    // 4. Return Result
    return res.status(200).json({
      status: 'success',
      reportId: reportId, // Send DB ID back to frontend
      filePath: gcsUri,
      ...aiResult
    });

  } catch (err) {
    console.error('🔥 Error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { upload, handleUpload };