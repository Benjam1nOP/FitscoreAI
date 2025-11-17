require('dotenv').config();
const express = require('express');
const path = require('path');
// Import both upload logic AND the new DB logic
const { upload, handleUpload } = require('./uploadHandler');
const { getUserHistory } = require('./dbService'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Defensive logging
console.log('✅ Starting FitScore AI backend...');
console.log('PORT:', PORT);

// Serve static files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// --- API ROUTES ---

// 1. Upload Route (POST)
app.post('/upload', upload.single('report'), handleUpload);

// 2. History Route (GET) - NEW!
app.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const history = await getUserHistory(userId);
  res.json(history);
});

// 3. Health Check
app.get('/_health', (req, res) => res.json({ status: 'ok' }));

// --- FRONTEND ROUTE ---
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Failed to send index.html:', err);
      res.status(500).send('Index not found.');
    }
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`✅ FitScore AI backend is running on port ${PORT}`);
});