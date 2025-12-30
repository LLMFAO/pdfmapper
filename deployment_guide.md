# HIPAA-Compliant Deployment Guide: Firebase & Cloud Run

This guide outlines the architecture and steps to deploy your **PDF Mapper** application on Google Cloud Platform (GCP) while maintaining HIPAA compliance.

> **⚠️ BAA NOTICE**: To be HIPPA compliant, you must sign a **Business Associate Agreement (BAA)** with Google. If you are on a paid GCP environment (unpaid tiers usually don't qualify), you can review and accept the BAA in the Google Cloud Console under **IAM & Admin > Identity & Organization**.

---

## 1. Architecture Overview

- **Frontend**: Next.js App (React 19)
    - Hosted on **Cloud Run** (for SSR/Protection) or **Firebase Hosting** (rewrites to Cloud Run).
    - **Recommendation**: Deploy directly to Cloud Run behind a Global Load Balancer (optional) or just use the Cloud Run URL for simplicity regarding BAA scope, though Firebase Hosting is also covered under the BAA.
- **Backend Service**: Python FastAPI (PyMuPDF)
    - Hosted on **Cloud Run** (Sidecar or Separate Service).
    - **Recommendation**: Separate Cloud Run service for isolation.
- **Database**: **Cloud Firestore** (Native Mode)
    - Stores Templates, Fields, and Submission metadata.
    - Encrypted at rest by default.
- **Storage**: **Cloud Storage for Firebase**
    - Stores raw PDF files and generated (filled) PDFs.
    - Encrypted at rest by default.
- **Auth**: **Firebase Authentication** (or Google Cloud Identity Platform).
    - **HIPAA Note**: Use **Identity Platform** (an upgrade to Firebase Auth) for enterprise SLAs and clearer HIPAA alignment, though standard Firebase Auth is often used. Ensure "Email/Password" or "Enterprise SSO" is used; avoid social logins (Facebook/Twitter) for staff access if stricter controls are needed.

---

## 2. Infrastructure Setup (Google Cloud Console)

### Step 1: Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `pdf-mapper-prod`).
3. **Billing**: Link a billing account. **Crucial** for BAA validation.

### Step 2: Enable APIs
Run the following in Cloud Shell or search in Console:
```bash
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  identitytoolkit.googleapis.com
```

### Step 3: Configure BAA
1. Navigate to **IAM & Admin** > **Compliance** or **Organization Policies**.
2. If you are an Organization Admin, ensure the [BAA is accepted](https://cloud.google.com/security/compliance/hipaa).

### Step 4: Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. "Add project" -> Select your GCP project `pdf-mapper-prod`.
3. **Authentication**: Enable "Email/Password".
4. **Firestore**: Create Database -> **Production Mode** -> Select Region (e.g., `us-central1`). **Multi-region** is good for availability but check specific data residency requirements.
5. **Storage**: Enable Storage -> "Start in production mode".

---

## 3. Deployment Steps

### A. Backend Service (Python)

Already ready in `python-service/`.

1. **Build & Deploy**:
   ```bash
   cd python-service
   
   # Set Project
   gcloud config set project pdf-mapper-prod
   
   # Deploy
   gcloud run deploy pdf-mapper-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --min-instances 0 \
     --max-instances 10
   ```
   > *Note: For HIPAA, you might want `--no-allow-unauthenticated` and use a Service Account from the frontend, but for a public-facing API (if users login via the frontend), you handle Auth inside the app.*

### B. Frontend Service (Next.js)

We have added a `Dockerfile` to the root.

1. **Build & Deploy**:
   ```bash
   # From project root
   gcloud run deploy pdf-mapper-ui \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Environment Variables**:
   In Cloud Run console > pdf-mapper-ui > Edit & Deploy New Revision > Variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: (From Firebase Console settings)
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `[project-id].firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `[project-id]`
   - `NEXT_PUBLIC_API_URL`: URL of the deployed `pdf-mapper-api`.

---

## 4. Application Integration Change Log (Required Implementation)

To connect the app, we need to implement the following changes in the code:

### 1. Firebase Initialization (`src/lib/firebase.ts`)
Needs to be created to initialize the SDK.

### 2. Update Persistance Store (`src/store/template.ts`)
Modify Zustand middleware or add specific async actions to save/load from Firestore.

- **Load**: `useEffect` on app mount -> `collection('templates').doc(id).get()`
- **Save**: `debounce` updates to `updateField` -> `doc.update(...)`
- **Files**: `setPdfFile` should upload to `storage().ref().put()` and get a Download URL.

---

## 5. Security & Access Control (Firestore Rules)

**Required** for HIPAA compliance to ensuring users only access their own PHI/Data.

**firestore.rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /templates/{templateId} {
      // Allow read/write if the user "owns" the template
      allow create: if request.auth != null;
      allow read, write: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

**storage.rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /user_docs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
