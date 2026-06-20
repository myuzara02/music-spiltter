import json
import logging
from fastapi import APIRouter, HTTPException
from app.config import OUTPUT_DIR

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["beats"])

@router.get("/beats/{job_id}")
async def get_beats(job_id: str):
    """Get detected tempo (BPM) and beat timings for a completed job."""
    beat_file = OUTPUT_DIR / job_id / "beats.json"

    if not beat_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Beat data not found for job {job_id}."
        )

    try:
        return json.loads(beat_file.read_text())
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Failed to read beats for job {job_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to read beat data."
        )
