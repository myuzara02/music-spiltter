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
