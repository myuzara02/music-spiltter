"""
Music Splitter — Chords Router

Serves detected chord data for completed jobs.
"""

import json
import logging

from fastapi import APIRouter, HTTPException

from app.config import OUTPUT_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chords"])


@router.get("/chords/{job_id}")
async def get_chords(job_id: str):
    """
    Get detected chords for a completed job.

    Returns chord data previously saved during separation.
    """
    chord_file = OUTPUT_DIR / job_id / "chords.json"

    if not chord_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Chords not found for job {job_id}. "
                   "The job may still be processing or chord detection was not run.",
        )

    try:
        data = json.loads(chord_file.read_text())
        return data
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Failed to read chords for job {job_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to read chord data.",
        )
