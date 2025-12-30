"""
PDF Mapper - Python Backend

FastAPI service for PDF processing with PyMuPDF.
Handles template-based data injection into PDFs.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io

from pdf_processor import PDFProcessor

app = FastAPI(
    title="PDF Mapper API",
    description="Process PDFs with field injection",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add production domains here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATA MODELS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


class FieldRect(BaseModel):
    """Field position as percentages (0.0 - 1.0)"""
    x: float
    y: float
    w: float
    h: float


class Field(BaseModel):
    """A single field definition"""
    id: str
    key: str
    type: str  # 'text', 'date', 'checkbox'
    page_number: int  # 1-indexed
    rect: FieldRect


class Template(BaseModel):
    """Template with field definitions"""
    name: str
    page_count: int
    fields: list[Field]


class ProcessRequest(BaseModel):
    """Request to process a PDF with data"""
    pdf_base64: str  # Base64 encoded PDF
    template: Template
    data: dict[str, str | bool | int | float | None]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", version="1.0.0")


@app.post("/process-pdf")
async def process_pdf(request: ProcessRequest):
    """
    Process a PDF template with injected data.
    
    Steps:
    1. Decode PDF from base64
    2. Iterate through template fields
    3. Calculate PDF coordinates from percentage positions
    4. Inject text/data at each field location
    5. Return the processed PDF as binary stream
    """
    try:
        processor = PDFProcessor()
        
        # Process the PDF
        output_pdf = processor.process(
            pdf_base64=request.pdf_base64,
            template=request.template,
            data=request.data,
        )
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(output_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{request.template.name}_filled.pdf"'
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to process PDF")


@app.post("/validate-pdf")
async def validate_pdf(pdf_base64: str):
    """
    Validate a PDF and return page count.
    """
    try:
        processor = PDFProcessor()
        page_count = processor.get_page_count(pdf_base64)
        return {"valid": True, "page_count": page_count}
    except Exception as e:
        return {"valid": False, "error": str(e)}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
