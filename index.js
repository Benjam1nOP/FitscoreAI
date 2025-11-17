require('dotenv').config();
const express = require('express');
const path = require('path');
const { upload, handleUpload } = require('./uploadHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Defensive: log env & important vars
console.log('✅ Starting FitScore AI backend...');
console.log('PORT:', PORT);
console.log('GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME ? '✔ set' : '⚠ MISSING');

// Serve static files from the 'public' directory (absolute path)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Failed to send index.html:', err);
      return res.status(500).send('Index not found.');
    }
  });
});

// Upload endpoint (expected by your UI)
app.post('/upload', upload.single('report'), handleUpload);

// Small health/readiness route
app.get('/_health', (req, res) => res.json({ status: 'ok', message: 'FitScore AI backend is running' }));

// Debug: list public files
app.get('/_ls_public', (req, res) => {
  const fs = require('fs');
  fs.readdir(publicDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'cannot read public dir', details: err.message });
    res.json({ publicDir, files });
  });
});

// Global error handlers so process doesn't die silently
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // optionally exit or keep running; we'll log and keep running for dev
});

process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at:', p, 'reason:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`✅ FitScore AI backend is running. Use POST /upload to send a medical report.`);
  console.log(`Open http://localhost:${PORT}/ in your web browser (or use Cloud Shell web preview).`);
});

// If the server is closed by something else, show why
server.on('error', (err) => {
  console.error('Server error:', err);
});
