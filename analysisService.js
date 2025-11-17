const vision = require('@google-cloud/vision');
const { VertexAI } = require('@google-cloud/vertexai');

// 1. Setup Vision Client
const visionClient = new vision.ImageAnnotatorClient();

// 2. Setup Vertex AI (Gemini)
const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION;
const vertexAI = new VertexAI({ project: project, location: location });

// Select the model (Flash is faster/cheaper)
const model = vertexAI.preview.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

async function analyzeMedicalReport(gcsUri) {
  console.log(`🔍 Starting OCR on: ${gcsUri}`);

  try {
    // --- STEP A: OCR (Extract Text) ---
    // We send the GCS URI directly to Vision API
    const [result] = await visionClient.textDetection(gcsUri);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      throw new Error("No text found in the document. Is it a valid image/PDF?");
    }

    const fullText = detections[0].description;
    console.log(`📄 Text extracted (${fullText.length} chars). Sending to Gemini...`);

    // --- STEP B: Gemini Analysis ---
    const prompt = `
      You are a medical fitness expert. Analyze the following medical report text.
      
      TEXT:
      """
      ${fullText}
      """

      TASK:
      1. Extract BMI, Blood Pressure, Blood Sugar, and Cholesterol if present.
      2. If BMI is not present but height/weight are, calculate BMI.
      3. Assign a "FitScore" from 0-100 based on the vitals (100 is perfect health).
      4. Determine BMI Status (Underweight, Healthy Weight, Overweight, Obese).
      5. Create a 3-item simplified diet plan based on the findings.

      OUTPUT FORMAT:
      Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
      
      JSON Structure:
      {
        "score": 85,
        "summary": "Short summary of health status (max 20 words).",
        "bmi": 24.5,
        "bmiStatus": "Healthy Weight",
        "vitals": {
          "bp": "120/80 mmHg",
          "sugar": "95 mg/dL",
          "cholesterol": "180 mg/dL"
        },
        "dietPlan": [
          "Recommendation 1",
          "Recommendation 2",
          "Recommendation 3"
        ]
      }
      
      If a value is missing in the text, use "N/A" for strings or 0 for numbers.
    `;

    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    const streamingResp = await model.generateContent(request);
    const response = await streamingResp.response;
    let jsonString = response.candidates[0].content.parts[0].text;

    // Cleanup: Remove markdown code blocks if Gemini adds them
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    const analysisData = JSON.parse(jsonString);
    console.log("🧠 Gemini analysis complete.");
    
    return analysisData;

  } catch (error) {
    console.error("Error in AI Service:", error);
    throw error;
  }
}

module.exports = { analyzeMedicalReport };