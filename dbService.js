const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID, 
  });
}

const db = admin.firestore();

// --- WRITE: Save a new report ---
async function saveReport(userId, reportData) {
  try {
    const docRef = await db.collection('reports').add({
      userId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...reportData 
    });
    
    console.log(`💾 Saved report to Firestore with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("🔥 Error saving to DB:", error);
    return null;
  }
}

// --- READ: Get user history ---
async function getUserHistory(userId) {
  try {
    console.log(`📖 Fetching history for user: ${userId}`);
    const snapshot = await db.collection('reports')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        date: data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'N/A',
        fileName: data.fileName || 'Unknown File',
        score: data.score || 0,
        summary: data.summary || 'No summary',
        
        // ✅ THESE WERE MISSING BEFORE:
        vitals: data.vitals || {},
        recommendations: data.recommendations || {}
      });
    });
    
    return history;

  } catch (error) {
    console.error("🔥 Error fetching history:", error);
    return [];
  }
}

module.exports = { saveReport, getUserHistory };