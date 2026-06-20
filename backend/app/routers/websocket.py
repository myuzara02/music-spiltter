"""
Music Splitter — WebSocket Router

Real-time progress updates during stem separation.
"""

from __future__ import annotations

import asyncio
import json
import logging
import traceback
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import MODELS, OUTPUT_DIR, UPLOAD_DIR
from app.models.schemas import ChordSegment, JobResult, StemInfo
from app.services.separator import separator_service
from app.services.chord_detector import chord_detector_service
from app.services.beat_detector import beat_detector_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/progress/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time separation progress.

    Client connects with job_id, sends model name to start,
    receives progress updates until completion.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for job {job_id}")

    try:
        # Wait for client to send start command with model info
        start_data = await websocket.receive_json()
        model_name = start_data.get("model", "htdemucs_ft")

        if model_name not in MODELS:
            await websocket.send_json({
                "job_id": job_id,
                "percent": 0,
                "stage": "error",
                "message": f"Invalid model: {model_name}",
            })
            await websocket.close()
            return

        # Find the uploaded file
        job_upload_dir = UPLOAD_DIR / job_id
        if not job_upload_dir.exists():
            await websocket.send_json({
                "job_id": job_id,
                "percent": 0,
                "stage": "error",
                "message": "Upload not found. Please upload a file first.",
            })
            await websocket.close()
            return

        # Get the uploaded file (first file in upload dir)
        uploaded_files = list(job_upload_dir.iterdir())
        if not uploaded_files:
            await websocket.send_json({
                "job_id": job_id,
                "percent": 0,
                "stage": "error",
                "message": "No uploaded file found.",
            })
            await websocket.close()
            return

        input_path = uploaded_files[0]
        output_dir = OUTPUT_DIR / job_id

        # Progress callback that sends updates via WebSocket
        loop = asyncio.get_event_loop()

        async def send_progress(percent: float, stage: str, current_stem: Optional[str]):
            try:
                await websocket.send_json({
                    "job_id": job_id,
                    "percent": round(percent, 1),
                    "stage": stage,
                    "current_stem": current_stem,
                    "message": _stage_message(stage, current_stem, percent),
                })
            except Exception:
                pass  # Client may have disconnected

        def progress_callback(percent: float, stage: str, current_stem: Optional[str]):
            """Sync callback that schedules async WebSocket send."""
            asyncio.run_coroutine_threadsafe(
                send_progress(percent, stage, current_stem),
                loop,
            )

        # Run separation in a thread to avoid blocking the event loop
        stem_paths = await asyncio.to_thread(
            separator_service.separate,
            input_path=str(input_path),
            output_dir=str(output_dir),
            model_name=model_name,
            progress_callback=progress_callback,
        )

        # Build result with stem info
        stems = []
        for stem_name, stem_path in stem_paths.items():
            stem_path = Path(stem_path)
            stems.append(StemInfo(
                name=stem_name,
                filename=stem_path.name,
                size_bytes=stem_path.stat().st_size,
                download_url=f"/api/download/{job_id}/{stem_name}",
            ))

        # Stage 4: Chord detection on original audio
        await send_progress(92.0, "detecting_chords", None)

        try:
            chords_raw = await asyncio.to_thread(
                chord_detector_service.detect_chords,
                str(input_path),
            )
            chord_segments = [ChordSegment(**c) for c in chords_raw]

            # Save chords to JSON for later retrieval via REST endpoint
            chord_data = {
                "job_id": job_id,
                "chords": [c.model_dump() for c in chord_segments],
            }
            chord_file = output_dir / "chords.json"
            chord_file.write_text(json.dumps(chord_data, indent=2))
            logger.info(f"Job {job_id}: chord detection complete, {len(chord_segments)} segments")
        except Exception as chord_err:
            logger.warning(f"Job {job_id}: chord detection failed (non-fatal): {chord_err}")
            chord_segments = []

        # Stage 5: Beat and BPM detection
        await send_progress(96.0, "detecting_beats", None)
        try:
            bpm, beats = await asyncio.to_thread(
                beat_detector_service.detect_beats,
                str(input_path),
            )
            
            # Save beats data to JSON file
            beat_data = {
                "job_id": job_id,
                "bpm": bpm,
                "beats": beats,
            }
            beat_file = output_dir / "beats.json"
            beat_file.write_text(json.dumps(beat_data, indent=2))
            logger.info(f"Job {job_id}: beat detection complete, BPM={bpm}, {len(beats)} beats")
        except Exception as beat_err:
            logger.warning(f"Job {job_id}: beat detection failed (non-fatal): {beat_err}")
            bpm = 120.0
            beats = []

        result = JobResult(
            job_id=job_id,
            status="complete",
            model_used=model_name,
            stems=stems,
            chords=chord_segments,
            bpm=bpm,
            beats=beats,
        )

        await websocket.send_json({
            "job_id": job_id,
            "percent": 100.0,
            "stage": "complete",
            "current_stem": None,
            "message": "Separation complete!",
            "result": result.model_dump(),
        })

        logger.info(f"Job {job_id}: separation complete, {len(stems)} stems, {len(chord_segments)} chords")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for job {job_id}")
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}\n{traceback.format_exc()}")
        try:
            await websocket.send_json({
                "job_id": job_id,
                "percent": 0,
                "stage": "error",
                "current_stem": None,
                "message": f"Separation failed: {str(e)}",
            })
        except Exception:
            pass  # Client already gone


def _stage_message(stage: str, current_stem: Optional[str], percent: float) -> str:
    """Generate a human-readable message for the current stage."""
    messages = {
        "loading_model": "Loading AI model...",
        "separating": "Separating audio tracks...",
        "saving": f"Saving {current_stem}..." if current_stem else "Saving stems...",
        "detecting_chords": "Detecting chords...",
        "detecting_beats": "Detecting tempo & beats...",
        "complete": "Separation complete!",
        "error": "An error occurred.",
    }
    return messages.get(stage, f"Processing... ({percent:.0f}%)")
