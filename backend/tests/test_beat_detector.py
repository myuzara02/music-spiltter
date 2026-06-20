import unittest
from pathlib import Path
import numpy as np
from app.services.beat_detector import beat_detector_service

class TestBeatDetector(unittest.TestCase):
    def test_format_beats(self):
        # We check if beat detector lazy loads and can run detection
        # Generate a dummy click track (sine wave pulses)
        sr = 44100
        duration = 5.0
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        # Create 120 BPM clicks (every 0.5 seconds)
        audio_data = np.zeros_like(t)
        for click_time in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]:
            idx = int(click_time * sr)
            audio_data[idx:idx+100] = np.sin(2 * np.pi * 1000 * np.linspace(0, 0.01, 100))
            
        import scipy.io.wavfile as wav
        test_file = Path("tests/dummy_beat_test.wav")
        test_file.parent.mkdir(parents=True, exist_ok=True)
        wav.write(test_file, sr, (audio_data * 32767).astype(np.int16))
        
        try:
            bpm, beats = beat_detector_service.detect_beats(test_file)
            print(f"Detected BPM: {bpm}, Beats: {beats}")
            self.assertGreater(bpm, 0)
            self.assertGreater(len(beats), 0)
        finally:
            if test_file.exists():
                test_file.unlink()

if __name__ == "__main__":
    unittest.main()
