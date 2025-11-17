const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// It automatically uses your 'GOOGLE_APPLICATION_CREDENTIALS' (Service Account)
// so we don't need to provide extra keys here!
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID, 
  });
}

const db = admin.firestore();

async function saveReport(userId, reportData) {
  try {
    const docRef = await db.collection('reports').add({
      userId: userId || 'anonymous', // We will fix this when we add Frontend Auth
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...reportData // Spreads score, summary, bmi, etc.
    });
    
    console.log(`💾 Saved report to Firestore with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("🔥 Error saving to DB:", error);
    // We don't throw here because we still want to return the analysis to the user
    // even if saving fails.
    return null;
  }
}

module.exports = { saveReport };