"""
Music Splitter — Application Configuration
"""

import os
import torch
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# File constraints
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".wma", ".aac"}

# Demucs model configuration
MODELS = {
    "htdemucs_ft": {
        "name": "htdemucs_ft",
        "label": "4 Stems (Fine-tuned)",
        "stems": ["vocals", "drums", "bass", "other"],
        "description": "Vocals, Drums, Bass, Other — best quality for 4-stem separation",
    },
    "htdemucs_6s": {
        "name": "htdemucs_6s",
        "label": "6 Stems",
        "stems": ["vocals", "drums", "bass", "guitar", "piano", "other"],
        "description": "Vocals, Drums, Bass, Guitar, Piano, Other — most detailed separation",
    }
}

DEFAULT_MODEL = "htdemucs_ft"

# Processing settings


def get_default_device():
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


DEVICE = os.environ.get("DEMUCS_DEVICE", get_default_device())
SHIFTS = int(os.environ.get("DEMUCS_SHIFTS", "1"))  # Higher = better quality, slower
OVERLAP = float(os.environ.get("DEMUCS_OVERLAP", "0.25"))
SEGMENT = int(os.environ.get("DEMUCS_SEGMENT", "10"))  # Seconds per chunk

# Output settings
OUTPUT_FORMAT = "wav"  # Lossless WAV
OUTPUT_SAMPLE_RATE = 44100
OUTPUT_BITDEPTH = 16

# Server settings
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
]

# Cleanup: auto-delete outputs older than N hours
CLEANUP_HOURS = 24
