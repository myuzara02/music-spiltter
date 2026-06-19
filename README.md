# 🎵 Music Splitter

AI-powered music stem separation using **Demucs v4** by Meta Research.

Split any song into individual stems: **Vocals**, **Drums**, **Bass**, **Guitar**, **Piano**, and **Other** — with studio-grade quality.

## Features

- 🎯 **4-stem mode** (htdemucs_ft) — Vocals, Drums, Bass, Other
- 🎼 **6-stem mode** (htdemucs_6s) — Vocals, Drums, Bass, Guitar, Piano, Other
- 📊 **Real-time progress** via WebSocket
- 🎨 **Premium dark UI** based on Composio design system
- 🐳 **Docker ready** — one command to run
- ⚡ **GPU support** — optional NVIDIA CUDA acceleration

## Quick Start

### With Docker (Recommended)

```bash
docker-compose up --build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Without Docker

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Demucs v4 (Meta Research) |
| Backend | Python, FastAPI, PyTorch |
| Frontend | React, Vite, Vanilla CSS |
| Container | Docker, docker-compose |

## Supported Formats

MP3, WAV, FLAC, OGG, M4A, WMA, AAC (up to 50MB)

## GPU Acceleration

For faster processing (~10x), uncomment the GPU section in `docker-compose.yml` and ensure you have:

1. NVIDIA GPU with CUDA support
2. [nvidia-docker](https://github.com/NVIDIA/nvidia-docker) runtime installed

## License

MIT — Powered by [Demucs](https://github.com/facebookresearch/demucs) (MIT License)
