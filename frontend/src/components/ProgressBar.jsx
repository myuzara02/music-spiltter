/**
 * Music Splitter — Progress Bar Component
 *
 * Real-time progress display during separation.
 */

import './ProgressBar.css';

export default function ProgressBar({ percent, stage, currentStem, message }) {
  return (
    <section className="progress-section" id="progress-section">
      <div className="progress-section__inner container">
        {/* Spotlight glow */}
        <div className="progress-section__glow" />

        <div className="progress-content">
          <div className="progress-header">
            <h2 className="text-display-sm">Processing your track</h2>
            <p className="progress-message">{message}</p>
          </div>

          <div className="progress-bar-wrapper" id="progress-bar">
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
              <div
                className="progress-bar__glow"
                style={{ left: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="progress-bar__info">
              <span className="progress-bar__stage">
                {stage === 'loading_model' && '🧠 Loading AI model...'}
                {stage === 'separating' && '🎵 Separating tracks...'}
                {stage === 'saving' && `💾 Saving ${currentStem || 'stems'}...`}
                {stage === 'connecting' && '🔌 Connecting...'}
                {stage === 'starting' && '🚀 Starting...'}
              </span>
              <span className="progress-bar__percent">{Math.round(percent)}%</span>
            </div>
          </div>

          {/* Animated equalizer visualization */}
          <div className="progress-equalizer">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="progress-equalizer__bar"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  height: `${12 + Math.random() * 28}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
