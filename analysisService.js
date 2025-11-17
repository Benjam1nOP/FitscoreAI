const { VertexAI } = require('@google-cloud/vertexai');

// 1. Setup Vertex AI
// We removed 'google-cloud/vision' because Gemini 2.5 reads files natively!
const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION;
const vertexAI = new VertexAI({ project: project, location: location });

// 2. Select the Model
// We use 'gemini-2.5-flash' because it is optimized for high-volume document processing (PDFs)
const model = vertexAI.preview.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

/**
 * Analyzes a medical report (Image or PDF) using Gemini Multimodal capabilities.
 * @param {string} gcsUri - The Google Cloud Storage path (gs://...)
 * @param {string} mimeType - The file type (e.g., 'application/pdf' or 'image/png')
 */
async function analyzeMedicalReport(gcsUri, mimeType) {
  console.log(`🧠 Gemini receiving file: ${gcsUri} [${mimeType}]`);

  try {
    // --- STEP A: Construct the Multimodal Request ---
    
    // 1. The File Part: Direct reference to Cloud Storage
    const filePart = {
      fileData: {
        fileUri: gcsUri,
        mimeType: mimeType, // Crucial: Tells Gemini if it's reading a PDF or Image
      },
    };

    // 2. The Text Part: The Instructions
    const textPart = {
      text: `
      You are a senior medical fitness expert. Analyze the attached medical document. 
      It may be a multi-page PDF or an image.

      TASK:
      1. **Scan**: Read the entire document (all pages).
      2. **Extract**: Identify all measurable vitals (BMI, Blood Pressure, Glucose, Cholesterol, Hemoglobin, Vitamin D, etc.).
      3. **Score**: Calculate a "FitScore" (0-100) based on the overall health markers.
      4. **Recommend**: Provide specific advice in three distinct categories: Diet, Exercise, and Lifestyle.

      OUTPUT FORMAT:
      Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
      
      JSON Structure:
      {
        "score": 75,
        "summary": "A concise summary of the patient's health status.",
        "vitals": {
          "Blood Pressure": "120/80 mmHg (Normal)",
          "Glucose": "95 mg/dL (Optimal)",
          "BMI": "24.2 (Healthy)"
          // Add other vitals dynamically as you find them
        },
        "recommendations": {
          "diet": ["Suggestion 1", "Suggestion 2"],
          "exercise": ["Suggestion 1", "Suggestion 2"],
          "lifestyle": ["Suggestion 1", "Suggestion 2"]
        }
      }
      
      If values are missing, exclude them or use "N/A".
      `
    };

    // --- STEP B: Send to Gemini ---
    const request = {
      contents: [{ role: 'user', parts: [filePart, textPart] }],
    };

    console.log("🚀 Sending to Vertex AI...");
    const result = await model.generateContent(request);
    const response = await result.response;
    
    // --- STEP C: Parse Response ---
    let jsonString = response.candidates[0].content.parts[0].text;

    // Cleanup: Remove markdown code blocks if Gemini adds them
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    const analysisData = JSON.parse(jsonString);
    console.log("✅ Gemini analysis complete.");
    
    return analysisData;

  } catch (error) {
    console.error("🔥 Error in AI Service:", error);
    // Return a safe fallback so the UI doesn't crash
    return {
      score: 0,
      summary: "Error interpreting document. Please ensure the file is clear.",
      vitals: {},
      recommendations: { diet: [], exercise: [], lifestyle: [] }
    };
  }
}

module.exports = { analyzeMedicalReport };