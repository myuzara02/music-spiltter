"""
Music Splitter — Download Router

Serves separated stem files for download.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
import torchaudio

from app.config import OUTPUT_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["download"])


@router.get("/download/{job_id}/{stem_name}")
async def download_stem(job_id: str, stem_name: str):
    """
    Download a separated stem file.

    Args:
        job_id: The separation job ID
        stem_name: Name of the stem (e.g., "vocals", "drums")
    """
    stem_path = OUTPUT_DIR / job_id / f"{stem_name}.wav"

    if not stem_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Stem '{stem_name}' not found for job {job_id}",
        )

    return FileResponse(
        path=str(stem_path),
        media_type="audio/wav",
        filename=f"{stem_name}.wav",
        headers={"Content-Disposition": f'attachment; filename="{stem_name}.wav"'},
    )


@router.get("/stems/{job_id}")
async def list_stems(job_id: str):
    """List available stems for a completed job."""
    job_dir = OUTPUT_DIR / job_id

    if not job_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Job {job_id} not found",
        )

    stems = []
    for stem_file in sorted(job_dir.glob("*.wav")):
        stems.append({
            "name": stem_file.stem,
            "filename": stem_file.name,
            "size_bytes": stem_file.stat().st_size,
            "download_url": f"/api/download/{job_id}/{stem_file.stem}",
        })

    return {"job_id": job_id, "stems": stems}


@router.get("/mix/{job_id}")
async def download_custom_mix(job_id: str, request: Request):
    """
    Download a custom mix of separated stems using custom volume levels.
    Volumes are provided as query parameters: ?vocals=1.0&drums=0.5
    """
    job_dir = OUTPUT_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Read query parameters
    volumes = {}
    pans = {}
    for key, val in request.query_params.items():
        if key == 't':
            continue # cache buster
        if key.endswith('_pan'):
            base_key = key[:-4]
            try:
                pans[base_key] = float(val)
            except ValueError:
                pans[base_key] = 0.0
        else:
            try:
                volumes[key] = float(val)
            except ValueError:
                volumes[key] = 1.0

    mixed_tensor = None
    sample_rate = 44100
    import math
    
    # We only want to mix the base stems, not any previously generated custom_mix.wav
    stem_files = [f for f in job_dir.glob("*.wav") if f.name != "custom_mix.wav"]

    if not stem_files:
        raise HTTPException(status_code=404, detail="No stems found to mix")

    for stem_file in stem_files:
        stem_name = stem_file.stem
        # Default volume to 1.0 if not specified
        vol = volumes.get(stem_name, 1.0)
        pan = pans.get(stem_name, 0.0)
        
        # Load stem tensor
        waveform, sr = torchaudio.load(str(stem_file))
        sample_rate = sr
        
        # If mono, convert to stereo
        if waveform.shape[0] == 1:
            waveform = waveform.repeat(2, 1)
        
        # Apply gain
        waveform = waveform * vol
        
        # Apply pan
        if pan != 0.0:
            pan = max(-1.0, min(1.0, pan))
            angle = (pan + 1.0) * math.pi / 4.0
            left_gain = math.cos(angle) * 1.414
            right_gain = math.sin(angle) * 1.414
            waveform[0] = waveform[0] * left_gain
            waveform[1] = waveform[1] * right_gain
        
        if mixed_tensor is None:
            mixed_tensor = waveform
        else:
            # Match lengths if there are slight differences
            min_len = min(mixed_tensor.shape[1], waveform.shape[1])
            mixed_tensor = mixed_tensor[:, :min_len] + waveform[:, :min_len]

    if mixed_tensor is None:
        raise HTTPException(status_code=404, detail="Failed to process stems")
        
    # Prevent clipping by hard clamping
    mixed_tensor = mixed_tensor.clamp(-1.0, 1.0)

    # Save to a temporary file inside the job_dir
    mix_path = job_dir / "custom_mix.wav"
    torchaudio.save(str(mix_path), mixed_tensor, sample_rate, format="wav")

    return FileResponse(
        path=str(mix_path),
        media_type="audio/wav",
        filename="custom_mix.wav",
        headers={"Content-Disposition": 'attachment; filename="custom_mix.wav"'},
    )
