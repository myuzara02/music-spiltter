"""
Music Splitter — Demucs Separator Service

Wraps the Demucs Python API for audio stem separation.
Supports htdemucs_ft (4 stems) and htdemucs_6s (6 stems).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable, Optional

import torchaudio

from app.config import DEVICE, MODELS, OVERLAP, SHIFTS

logger = logging.getLogger(__name__)

# Type alias for progress callback: (percent: float, stage: str, current_stem: Optional[str]) -> None
ProgressCallback = Callable[[float, str, Optional[str]], None]


class SeparatorService:
    """Manages Demucs model loading and audio separation."""

    def __init__(self):
        self._separators: dict = {}  # Cache loaded models

    def _get_separator(self, model_name: str):
        """Get or create a Demucs Separator instance for the given model."""
        if model_name not in self._separators:
            logger.info(f"Loading Demucs model: {model_name}")
            # pyrefly: ignore [missing-import]
            import demucs.api

            separator = demucs.api.Separator(
                model=model_name,
                device=DEVICE,
                shifts=SHIFTS,
                overlap=OVERLAP,
                split=True,
                jobs=0,
                progress=False,  # We handle progress ourselves
            )
            self._separators[model_name] = separator
            logger.info(f"Model {model_name} loaded successfully on {DEVICE}")
        return self._separators[model_name]

    def separate(
        self,
        input_path: str | Path,
        output_dir: str | Path,
        model_name: str = "htdemucs_ft",
        progress_callback: Optional[ProgressCallback] = None,
    ) -> dict[str, Path]:
        """
        Separate an audio file into stems.

        Args:
            input_path: Path to input audio file
            output_dir: Directory to save output stems
            model_name: Demucs model name (htdemucs_ft or htdemucs_6s)
            progress_callback: Optional callback for progress updates

        Returns:
            Dict mapping stem name to output file path
        """
        input_path = Path(input_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        if model_name not in MODELS:
            raise ValueError(f"Unknown model: {model_name}. Available: {list(MODELS.keys())}")

        model_config = MODELS[model_name]
        expected_stems = model_config["stems"]

        # Stage 1: Loading model (0-10%)
        if progress_callback:
            progress_callback(0.0, "loading_model", None)

        separator = self._get_separator(model_name)

        # Stage 2: Separating audio (10-85%)
        if progress_callback:
            progress_callback(10.0, "separating", None)

            def demucs_callback(d):
                models = max(1, d.get('models', 1))
                model_idx = d.get('model_idx_in_bag', 0)
                audio_length = max(1, d.get('audio_length', 1))
                segment_offset = d.get('segment_offset', 0)
                
                model_progress = model_idx / models
                segment_progress = segment_offset / audio_length
                segment_progress = min(1.0, max(0.0, segment_progress))
                total_progress = model_progress + (segment_progress / models)
                
                mapped_progress = 10.0 + (total_progress * 75.0)
                progress_callback(mapped_progress, "separating", None)

            separator.update_parameter(callback=demucs_callback)
        else:
            separator.update_parameter(callback=None)

        logger.info(f"Separating: {input_path.name} with model {model_name} on {DEVICE}")

        origin, separated = separator.separate_audio_file(str(input_path))

        if progress_callback:
            progress_callback(85.0, "separating", None)

        # Stage 3: Saving stems (85-100%)
        stem_paths: dict[str, Path] = {}
        total_stems = len(expected_stems)

        for i, stem_name in enumerate(expected_stems):
            if stem_name not in separated:
                logger.warning(f"Stem '{stem_name}' not found in separation output")
                continue

            if progress_callback:
                pct = 85.0 + (i / total_stems) * 15.0
                progress_callback(pct, "saving", stem_name)

            stem_tensor = separated[stem_name]
            output_path = output_dir / f"{stem_name}.wav"

            # Save as WAV
            torchaudio.save(
                str(output_path),
                stem_tensor.cpu(),
                sample_rate=separator.samplerate,
            )

            stem_paths[stem_name] = output_path
            logger.info(f"Saved stem: {output_path} ({output_path.stat().st_size} bytes)")

        logger.info(f"Separation complete: {len(stem_paths)} stems saved to {output_dir}")
        return stem_paths


# Global singleton instance
separator_service = SeparatorService()
