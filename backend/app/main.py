"""
Music Splitter — FastAPI Application

Main entry point. Mounts all routers and configures CORS.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, OUTPUT_DIR, UPLOAD_DIR
from app.routers import download, upload, websocket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — setup and teardown."""
    # Startup: ensure directories exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Music Splitter backend started")
    logger.info(f"Upload dir: {UPLOAD_DIR}")
    logger.info(f"Output dir: {OUTPUT_DIR}")
    yield
    # Shutdown
    logger.info("Music Splitter backend shutting down")


app = FastAPI(
    title="Music Splitter",
    description="AI-powered music stem separation using Demucs v4",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(upload.router)
app.include_router(download.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Music Splitter",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/api/health")
async def health():
    """API health check."""
    return {"status": "healthy"}
