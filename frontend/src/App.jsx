/**
 * Music Splitter — Main Application
 *
 * State machine: idle → uploading → processing → complete
 */

import { useCallback, useState } from 'react';
import Header from './components/Header';
import HeroUpload from './components/HeroUpload';
import ProgressBar from './components/ProgressBar';
import ResultsPanel from './components/ResultsPanel';
import Footer from './components/Footer';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [appState, setAppState] = useState('idle'); // idle | uploading | processing | complete | error
  const [uploadError, setUploadError] = useState(null);
  const ws = useWebSocket();

  const handleUpload = useCallback(async (file, model) => {
    setAppState('uploading');
    setUploadError(null);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      const jobId = data.job_id;

      // Connect WebSocket for progress
      setAppState('processing');
      ws.connect(jobId, model);

    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Upload failed. Please check if the backend is running.');
      setAppState('error');
    }
  }, [ws]);

  const handleLoadDemo = useCallback(async () => {
    setAppState('processing');
    setUploadError(null);
    try {
      const demoJobId = 'f907c924-04b2-4b22-99af-c532f6e6d68d';
      
      // Fetch both chords and beats in parallel
      const [chordsRes, beatsRes] = await Promise.all([
        fetch(`${API_BASE}/api/chords/${demoJobId}`),
        fetch(`${API_BASE}/api/beats/${demoJobId}`)
      ]);
      
      if (!chordsRes.ok || !beatsRes.ok) throw new Error('Demo not available');
      
      const [chordsData, beatsData] = await Promise.all([
        chordsRes.json(),
        beatsRes.json()
      ]);
      
      const demoResult = {
        job_id: demoJobId,
        status: "complete",
        model_used: "htdemucs_6s",
        stems: [
          { name: "vocals", filename: "vocals.wav", size_bytes: 73482298, download_url: `/api/download/${demoJobId}/vocals` },
          { name: "drums", filename: "drums.wav", size_bytes: 73482298, download_url: `/api/download/${demoJobId}/drums` },
          { name: "bass", filename: "bass.wav", size_bytes: 73482298, download_url: `/api/download/${demoJobId}/bass` },
          { name: "guitar", filename: "guitar.wav", size_bytes: 73482298, download_url: `/api/download/${demoJobId}/guitar` },
          { name: "piano", filename: "piano.wav", size_bytes: 73482298, download_url: `/api/download/${demoJobId}/piano` },
          { name: "other", filename: "other.wav", size_bytes: 73482298, download_url: `/api/download/${demoJobId}/other` }
        ],
        chords: chordsData.chords,
        bpm: beatsData.bpm,
        beats: beatsData.beats
      };
      
      ws.setResult(demoResult);
      ws.setStage('complete');
      setAppState('complete');
    } catch (err) {
      console.error('Demo load error:', err);
      setUploadError(err.message || 'Failed to load demo.');
      setAppState('error');
    }
  }, [ws]);

  const handleReset = useCallback(() => {
    ws.reset();
    setAppState('idle');
    setUploadError(null);
  }, [ws]);

  // Determine current view based on WebSocket stage
  const isProcessing = appState === 'processing' && ws.stage !== 'complete' && ws.stage !== 'error';
  const isComplete = ws.stage === 'complete' && ws.result;
  const isError = appState === 'error' || ws.stage === 'error';

  return (
    <div className="app">
      <Header />

      <main className="main">
        {/* Upload view */}
        {(appState === 'idle' || appState === 'uploading' || (appState === 'error' && !isProcessing)) && !isComplete && (
          <HeroUpload
            onUpload={handleUpload}
            disabled={appState === 'uploading'}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {/* Uploading overlay */}
        {appState === 'uploading' && (
          <div className="upload-overlay" id="upload-overlay">
            <div className="upload-overlay__spinner" />
            <p className="upload-overlay__text">Uploading file...</p>
          </div>
        )}

        {/* Processing view */}
        {isProcessing && (
          <ProgressBar
            percent={ws.progress}
            stage={ws.stage}
            currentStem={ws.currentStem}
            message={ws.message}
          />
        )}

        {/* Results view */}
        {isComplete && (
          <ResultsPanel
            result={ws.result}
            onReset={handleReset}
          />
        )}

        {/* Error display */}
        {isError && (
          <div className="error-banner" id="error-banner">
            <div className="error-banner__inner container">
              <p className="error-banner__message">
                ⚠️ {ws.error || uploadError || 'An error occurred'}
              </p>
              <button
                className="btn-secondary"
                onClick={handleReset}
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
