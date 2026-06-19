/**
 * Music Splitter — Hero Upload Component
 *
 * Drag & drop file upload with spotlight glow backdrop.
 */

import { useCallback, useRef, useState } from 'react';
import ModelSelector from './ModelSelector';
import './HeroUpload.css';

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.wma', '.aac'];
const MAX_FILE_SIZE_MB = 50;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HeroUpload({ onUpload, disabled }) {
  const [file, setFile] = useState(null);
  const [model, setModel] = useState('htdemucs_ft');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported format: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File too large (${formatFileSize(f.size)}). Maximum: ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  }, []);

  const handleFile = useCallback((f) => {
    const error = validateFile(f);
    if (error) {
      setFileError(error);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }, [validateFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  }, [handleFile]);

  const handleSubmit = useCallback(() => {
    if (file && onUpload) {
      onUpload(file, model);
    }
  }, [file, model, onUpload]);

  return (
    <section className="hero" id="hero-upload">
      {/* Spotlight glow backdrop */}
      <div className="hero__glow" />

      <div className="hero__inner container">
        <div className="hero__text">
          <h1 className="text-display-mega">
            Split any song into stems
          </h1>
          <p className="hero__subtitle">
            AI-powered music source separation. Extract vocals, drums, bass,
            guitar, piano, and more with studio-grade quality.
          </p>
        </div>

        <div className="hero__upload-area">
          {/* Drop zone */}
          <div
            className={`dropzone ${isDragging ? 'dropzone--active' : ''} ${file ? 'dropzone--has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            id="dropzone"
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleInputChange}
              className="dropzone__input"
              id="file-input"
            />

            {file ? (
              <div className="dropzone__file-info">
                <div className="dropzone__file-icon">
                  <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                    <path d="M9 18V5l12-2v13" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="var(--color-primary)" strokeWidth="2"/>
                    <circle cx="18" cy="16" r="3" stroke="var(--color-primary)" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="dropzone__file-meta">
                  <span className="dropzone__file-name">{file.name}</span>
                  <span className="dropzone__file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  className="dropzone__change-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileError(null);
                  }}
                  type="button"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="dropzone__empty">
                <div className="dropzone__icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="dropzone__text">
                  <span className="dropzone__text-primary">Drop your audio file here</span>
                  <span className="dropzone__text-secondary">or click to browse</span>
                </p>
                <p className="dropzone__formats text-caption">
                  MP3, WAV, FLAC, OGG, M4A, AAC — up to {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            )}
          </div>

          {fileError && (
            <p className="hero__error" id="file-error">{fileError}</p>
          )}

          {/* Model selector */}
          <ModelSelector selectedModel={model} onSelectModel={setModel} />

          {/* Submit button */}
          <button
            className="btn-primary hero__submit"
            onClick={handleSubmit}
            disabled={!file || disabled}
            id="split-button"
            type="button"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Split Now
          </button>
        </div>
      </div>
    </section>
  );
}
