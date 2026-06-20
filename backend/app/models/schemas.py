"""
Music Splitter — Pydantic Schemas
"""

from __future__ import annotations
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class UploadResponse(BaseModel):
    """Response after successful file upload."""
    job_id: str
    filename: str
    model: str
    status: str = "processing"


class ProgressUpdate(BaseModel):
    """WebSocket progress message."""
    job_id: str
    percent: float
    stage: str  # "loading_model", "separating", "saving", "complete", "error"
    current_stem: Optional[str] = None
    message: str = ""


class ChordSegment(BaseModel):
    """A single chord segment with timing."""
    start: float        # Start time in seconds
    end: float          # End time in seconds
    label: str          # Chord label (e.g., "C", "Am", "G7")


class StemInfo(BaseModel):
    """Info about a single separated stem."""
    name: str
    filename: str
    size_bytes: int
    download_url: str


class JobResult(BaseModel):
    """Final result after separation completes."""
    job_id: str
    status: str  # "complete" or "error"
    model_used: str
    stems: List[StemInfo] = []
    chords: List[ChordSegment] = []
    error_message: Optional[str] = None


class ModelInfo(BaseModel):
    """Info about an available Demucs model."""
    name: str
    label: str
    stems: List[str]
    description: str
