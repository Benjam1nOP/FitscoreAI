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

// --- READ: Get user history (NEW) ---
async function getUserHistory(userId) {
  try {
    console.log(`📖 Fetching history for user: ${userId}`);
    const snapshot = await db.collection('reports')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc') // Newest first
      .limit(10) // Limit to last 10 for performance
      .get();

    if (snapshot.empty) {
      return [];
    }

    // Map the documents to a clean JSON array
    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        // Convert Firestore timestamp to readable date
        date: data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'N/A',
        score: data.score || 0,
        summary: data.summary || 'No summary',
        fileName: data.fileName || 'Unknown File'
      });
    });
    
    return history;

  } catch (error) {
    console.error("🔥 Error fetching history:", error);
    return [];
  }
}

module.exports = { saveReport, getUserHistory };