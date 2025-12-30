# PDF Mapper - Python Service

FastAPI backend for PDF processing with PyMuPDF.

## Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8080
```

## API Endpoints

### Health Check
```
GET /health
```

### Process PDF
```
POST /process-pdf
Content-Type: application/json

{
  "pdf_base64": "...",
  "template": {
    "name": "My Template",
    "page_count": 2,
    "fields": [
      {
        "id": "f1",
        "key": "first_name",
        "type": "text",
        "page_number": 1,
        "rect": { "x": 0.15, "y": 0.20, "w": 0.30, "h": 0.05 }
      }
    ]
  },
  "data": {
    "first_name": "John"
  }
}
```

## Docker Build

```bash
docker build -t pdf-mapper-api .
docker run -p 8080:8080 pdf-mapper-api
```

## Deploy to Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/pdf-mapper-api

# Deploy
gcloud run deploy pdf-mapper-api \
  --image gcr.io/PROJECT_ID/pdf-mapper-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
