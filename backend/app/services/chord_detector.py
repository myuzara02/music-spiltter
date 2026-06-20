"""
Music Splitter — Chord Detection Service

Detects chords from audio using madmom's DeepChromaProcessor
and DeepChromaChordRecognitionProcessor (CNN + CRF).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def _format_chord_label(label: str) -> str:
    """
    Convert MIREX-style chord labels to common notation.

    Examples:
        'C:maj'  -> 'C'
        'A:min'  -> 'Am'
        'G:maj7' -> 'Gmaj7'
        'Bb:min' -> 'Bbm'
        'N'      -> 'N'
    """
    if label == "N" or not label:
        return "N"

    if ":" not in label:
        return label

    root, quality = label.split(":", 1)

    quality_map = {
        "maj": "",
        "min": "m",
        "dim": "dim",
        "aug": "aug",
        "maj7": "maj7",
        "min7": "m7",
        "7": "7",
        "dim7": "dim7",
        "hdim7": "m7b5",
        "minmaj7": "mMaj7",
        "maj6": "6",
        "min6": "m6",
        "9": "9",
        "maj9": "maj9",
        "min9": "m9",
        "sus2": "sus2",
        "sus4": "sus4",
        "1": "5",
    }

    suffix = quality_map.get(quality, quality)
    return f"{root}{suffix}"


class ChordDetectorService:
    """Manages chord detection using madmom's deep chroma pipeline."""

    def __init__(self):
        self._dcp = None       # DeepChromaProcessor (lazy-loaded)
        self._decode = None    # DeepChromaChordRecognitionProcessor (lazy-loaded)

    def _load_processors(self):
        """Lazy-load madmom processors (heavy initialization)."""
        logger.info("Loading madmom chord detection processors...")
        from madmom.audio.chroma import DeepChromaProcessor
        from madmom.features.chords import DeepChromaChordRecognitionProcessor

        self._dcp = DeepChromaProcessor()
        self._decode = DeepChromaChordRecognitionProcessor()
        logger.info("Madmom chord processors loaded successfully")

    def detect_chords(self, audio_path: str | Path) -> list[dict]:
        """
        Detect chords from an audio file.

        Args:
            audio_path: Path to the input audio file (WAV, MP3, etc.)

        Returns:
            List of chord segments, each with:
                - start: float (seconds)
                - end: float (seconds)
                - label: str (e.g., "C", "Am", "G7")
        """
        audio_path = str(audio_path)

        if self._dcp is None:
            self._load_processors()

        logger.info(f"Detecting chords: {Path(audio_path).name}")

        # Step 1: Extract deep chroma features
        chroma = self._dcp(audio_path)

        # Step 2: Decode chord sequence using CRF
        chords_raw = self._decode(chroma)

        # Step 3: Convert numpy structured array to list of dicts
        chords = []
        for entry in chords_raw:
            start = float(entry[0])
            end = float(entry[1])
            label = str(entry[2])
            chords.append({
                "start": round(start, 3),
                "end": round(end, 3),
                "label": _format_chord_label(label),
            })

        logger.info(f"Chord detection complete: {len(chords)} segments found")
        return chords


# Global singleton instance
chord_detector_service = ChordDetectorService()
