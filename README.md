# 🧠 FitScore AI – Personalized Health Score and Insights from Medical Reports

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Run_%7C_Vision_%7C_Vertex_AI-4285F4)
![Firebase](https://img.shields.io/badge/Firebase-Auth_%7C_Firestore-FFCA28)

**FitScore AI** is a serverless, AI-powered application that transforms complex medical reports into clear, actionable health insights. By leveraging **Google Cloud Vertex AI (Gemini)** and **Cloud Vision**, users can simply upload a photo of their blood test or checkup report to receive an instant "FitScore," a personalized summary, and dietary recommendations.

---

## 🚀 Features

* **📸 Multimodal Ingestion:** Upload images (PNG/JPG) of medical reports directly from the browser.
* **👁️ OCR Extraction:** Uses **Google Cloud Vision API** to accurately read text from scans and photos.
* **🧠 AI Analysis:** Powered by **Gemini 1.5 Flash** to interpret medical data, calculate BMI, and assess vitals (Glucose, BP, Cholesterol).
* **📊 Personalized Dashboard:** Displays a calculated 0-100 "FitScore," status indicators, and AI-generated diet plans.
* **🔐 Secure Authentication:** Integrated **Firebase Authentication** (Google Sign-In) for secure user access.
* **☁️ Cloud Native:** Fully serverless architecture deployed on **Google Cloud Run** with data stored in **Firestore**.

---

## 🏗️ Architecture

The application follows a stateless, serverless microservices architecture:

```mermaid
graph TD
    User[👤 User Frontend] -->|1. Auth & Upload| Run[🚀 Node.js on Cloud Run]
    Run -->|2. Store File| GCS[📦 Cloud Storage]
    Run -->|3. Extract Text| Vision[👁️ Cloud Vision API]
    Run -->|4. Analyze Data| Gemini[🧠 Vertex AI (Gemini 1.5)]
    Run -->|5. Save Result| DB[🔥 Firestore Database]
    Run -->|6. JSON Response| User
````

1.  **Frontend:** HTML5/TailwindCSS interface handles file selection and auth.
2.  **Ingestion:** Files are streamed to **Cloud Storage**.
3.  **Processing:** **Vision API** performs OCR; **Gemini** analyzes the raw text against medical prompt guidelines.
4.  **Persistence:** Results are tagged with the User ID and saved to **Firestore**.

-----

## 🛠️ Tech Stack

  * **Frontend:** HTML5, TailwindCSS, Firebase Web SDK
  * **Backend:** Node.js, Express.js
  * **AI & ML:** Google Vertex AI (Gemini 1.5 Flash), Cloud Vision API
  * **Infrastructure:** Google Cloud Run, Cloud Build
  * **Storage & Database:** Google Cloud Storage, Firebase Firestore
  * **Security:** IAM Service Accounts, Firebase Auth

-----

## ⚡ Getting Started

Follow these steps to run the project locally.

### 1\. Prerequisites

  * Node.js (v18+) installed.
  * A Google Cloud Platform Account.
  * A Firebase Project (linked to Google Cloud).

### 2\. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/FitScoreAI.git](https://github.com/YOUR_USERNAME/FitScoreAI.git)
cd FitScoreAI
```

### 3\. Google Cloud Setup

1.  Create a project in Google Cloud Console.
2.  Enable the following APIs:
      * Vertex AI API
      * Cloud Vision API
      * Cloud Storage
      * Cloud Run API
3.  Create a **Service Account** with these roles:
      * `Storage Object Admin`
      * `Vertex AI User`
      * `Firebase Admin`
4.  Download the JSON key key for this service account and rename it to `service-account-key.json`.
5.  **Place this file in the root directory.** (Note: It is git-ignored for security).

### 4\. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
# Your Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
# Region for AI Models (Recommended: us-central1)
GOOGLE_CLOUD_LOCATION=us-central1
# Name of your storage bucket
GCS_BUCKET_NAME=your-unique-bucket-name
# Path to the key file you downloaded
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### 5\. Frontend Config

Update `public/index.html` with your **Firebase Web Configuration**:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    // ... other config values
};
```

### 6\. Run Locally

```bash
npm install
node index.js
```

Open `http://localhost:3000` in your browser.

-----

## 🚢 Deployment (Google Cloud Run)

This project includes a `Dockerfile` for easy deployment.

```bash
# 1. Set your project
gcloud config set project YOUR_PROJECT_ID

# 2. Deploy
gcloud run deploy fitscore-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account YOUR_SERVICE_ACCOUNT_EMAIL \
  --set-env-vars GCS_BUCKET_NAME=your-bucket,GOOGLE_CLOUD_PROJECT_ID=your-id,GOOGLE_CLOUD_LOCATION=us-central1
```

-----

## 📸 Screenshots

| Login Screen | Dashboard Analysis |
|:---:|:---:|
| *Add a screenshot of your login page here* | *Add a screenshot of the results page here* |

-----

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

-----

*Built for the Google Cloud Build & Blog Marathon.*

```
```