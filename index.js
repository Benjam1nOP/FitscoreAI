require('dotenv').config();
const express = require('express');
const { upload, handleUpload } = require('./uploadHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('✅ FitScore AI backend is running. Use POST /upload to send a medical report.');
});

// 📤 Upload route
app.post('/upload', upload.single('report'), handleUpload);

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
