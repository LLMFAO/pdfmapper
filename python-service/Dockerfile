# ═══════════════════════════════════════════════════════════════════════════
# PDF MAPPER - PYTHON SERVICE DOCKERFILE
# Multi-stage build for Cloud Run deployment
# ═══════════════════════════════════════════════════════════════════════════

FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/app/deps -r requirements.txt

# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies for PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /app/deps /app/deps

# Add deps to Python path
ENV PYTHONPATH=/app/deps

# Copy application code
COPY main.py .
COPY pdf_processor.py .

# Create non-root user for security
RUN useradd -m -u 1000 appuser
USER appuser

# Expose port for Cloud Run
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
