"""
Music Splitter — WebSocket Router

Real-time progress updates during stem separation.
"""

from __future__ import annotations

import asyncio
import logging
import traceback
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import MODELS, OUTPUT_DIR, UPLOAD_DIR
from app.models.schemas import JobResult, StemInfo
from app.services.separator import separator_service

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

        result = JobResult(
            job_id=job_id,
            status="complete",
            model_used=model_name,
            stems=stems,
        )

        await websocket.send_json({
            "job_id": job_id,
            "percent": 100.0,
            "stage": "complete",
            "current_stem": None,
            "message": "Separation complete!",
            "result": result.model_dump(),
        })

        logger.info(f"Job {job_id}: separation complete, {len(stems)} stems")

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
        "complete": "Separation complete!",
        "error": "An error occurred.",
    }
    return messages.get(stage, f"Processing... ({percent:.0f}%)")
