# Music Splitter Backend — Dockerfile
# Supports both CPU and GPU (via NVIDIA runtime)

FROM python:3.11-slim AS base

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .

# Install PyTorch CPU by default (smaller image)
# For GPU: override with --build-arg TORCH_INDEX_URL=https://download.pytorch.org/whl/cu121
ARG TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir torch torchaudio --index-url ${TORCH_INDEX_URL} && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download Demucs models (htdemucs_ft and htdemucs_6s)
# This avoids downloading on first request
RUN python -c "import demucs.api; demucs.api.Separator(model='htdemucs_ft'); print('htdemucs_ft loaded')" && \
    python -c "import demucs.api; demucs.api.Separator(model='htdemucs_6s'); print('htdemucs_6s loaded')"

# Copy application code
COPY app/ app/

# Create data directories
RUN mkdir -p uploads outputs

EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
