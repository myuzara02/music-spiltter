"""
Music Splitter — Upload Router

Handles file upload, validation, and initiates separation.
"""

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MODELS, OUTPUT_DIR, UPLOAD_DIR
from app.models.schemas import UploadResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    model: str = Form("htdemucs_ft"),
):
    """
    Upload an audio file for stem separation.

    Returns a job_id to track progress via WebSocket.
    """
    # Validate model selection
    if model not in MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model: {model}. Available: {list(MODELS.keys())}",
        )

    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum: {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
        )

    # Generate job ID and save file
    job_id = str(uuid.uuid4())
    job_upload_dir = UPLOAD_DIR / job_id
    job_upload_dir.mkdir(parents=True, exist_ok=True)

    # Preserve original filename
    safe_filename = file.filename.replace(" ", "_")
    input_path = job_upload_dir / safe_filename

    with open(input_path, "wb") as f:
        f.write(content)

    logger.info(f"Job {job_id}: uploaded {safe_filename} ({len(content)} bytes), model={model}")

    # Create output directory for this job
    job_output_dir = OUTPUT_DIR / job_id
    job_output_dir.mkdir(parents=True, exist_ok=True)

    return UploadResponse(
        job_id=job_id,
        filename=safe_filename,
        model=model,
        status="uploaded",
    )


@router.get("/models")
async def list_models():
    """List available separation models."""
    return {
        name: {
            "label": cfg["label"],
            "stems": cfg["stems"],
            "description": cfg["description"],
        }
        for name, cfg in MODELS.items()
    }
