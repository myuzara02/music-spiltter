from __future__ import annotations
from pathlib import Path
import numpy as np
import logging

logger = logging.getLogger(__name__)

class BeatDetectorService:
    def __init__(self):
        self._rnn_processor = None
        self._tracker = None

    def _load_processors(self):
        """Lazy-load madmom beat tracking processors."""
        logger.info("Loading madmom beat tracking processors...")
        from madmom.features.beats import RNNBeatProcessor, BeatTrackingProcessor
        
        self._rnn_processor = RNNBeatProcessor()
        self._tracker = BeatTrackingProcessor(fps=100)
        logger.info("Madmom beat processors loaded successfully")

    def detect_beats(self, audio_path: str | Path) -> tuple[float, list[float]]:
        """
        Detect beats and estimate average BPM from audio.
        """
        if self._rnn_processor is None:
            self._load_processors()
            
        audio_path = str(audio_path)
        logger.info(f"Detecting beats and tempo: {Path(audio_path).name}")
        
        activations = self._rnn_processor(audio_path)
        beat_times = self._tracker(activations)
        
        if len(beat_times) > 1:
            intervals = np.diff(beat_times)
            median_interval = np.median(intervals)
            bpm = round(60.0 / median_interval, 1)
        else:
            bpm = 120.0
            
        beats = [round(float(t), 3) for t in beat_times]
        logger.info(f"Tempo detection complete: {bpm} BPM, {len(beats)} beats found")
        
        return bpm, beats

beat_detector_service = BeatDetectorService()
