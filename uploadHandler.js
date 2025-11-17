const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { analyzeMedicalReport } = require('./analysisService');
const { saveReport } = require('./dbService'); 

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;
const upload = multer({ storage: multer.memoryStorage() });

const handleUpload = async (req, res) => {
  try {
    const file = req.file;
    // Get userId from frontend request, default to anonymous if missing
    const userId = req.body.userId || 'anonymous'; 

    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // Create a unique filename
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const bucket = storage.bucket(bucketName);
    const remoteFile = bucket.file(fileName);

    console.log(`📁 Uploading ${file.mimetype}: ${fileName}`);

    // 1. Upload to Cloud Storage
    await remoteFile.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      resumable: false,
    });
    
    const gcsUri = `gs://${bucketName}/${fileName}`;

    // 2. Analyze with Gemini (Native Multimodal)
    // CRITICAL UPDATE: We pass file.mimetype so Gemini knows if it's PDF or Image
    const aiResult = await analyzeMedicalReport(gcsUri, file.mimetype);

    // 3. Save to Firestore
    // We save the result along with the file URL and timestamp
    const reportId = await saveReport(userId, {
      fileUrl: gcsUri,
      fileName: file.originalname,
      ...aiResult // Spreads score, summary, vitals, recommendations
    });

    // 4. Return Result to Frontend
    return res.status(200).json({
      status: 'success',
      reportId: reportId,
      filePath: gcsUri,
      ...aiResult
    });

  } catch (err) {
    console.error('🔥 Upload Handler Error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { upload, handleUpload };