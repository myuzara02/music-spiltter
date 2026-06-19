/**
 * Music Splitter — Stem Card Component
 *
 * Individual stem result card with download button.
 */

import './StemCard.css';

const STEM_ICONS = {
  vocals: '🎤',
  drums: '🥁',
  bass: '🎸',
  guitar: '🎸',
  piano: '🎹',
  other: '🎶',
};

const STEM_COLORS = {
  vocals: '#ff6b6b',
  drums: '#ffa94d',
  bass: '#69db7c',
  guitar: '#74c0fc',
  piano: '#da77f2',
  other: '#868e96',
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StemCard({ stem }) {
  const icon = STEM_ICONS[stem.name] || '🎵';
  const color = STEM_COLORS[stem.name] || '#a8a8a8';
  const API_BASE = 'http://localhost:8000';

  return (
    <div className="stem-card" id={`stem-${stem.name}`}>
      <div className="stem-card__indicator" style={{ backgroundColor: color }} />

      <div className="stem-card__content">
        <div className="stem-card__header">
          <span className="stem-card__icon">{icon}</span>
          <div className="stem-card__info">
            <span className="stem-card__name">{stem.name}</span>
            <span className="stem-card__size">{formatFileSize(stem.size_bytes)}</span>
          </div>
        </div>

        <a
          href={`${API_BASE}${stem.download_url}`}
          download={stem.filename}
          className="btn-secondary stem-card__download"
          id={`download-${stem.name}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download WAV
        </a>
      </div>
    </div>
  );
}
