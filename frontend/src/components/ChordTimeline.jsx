/**
 * Music Splitter — Chord Timeline Component
 *
 * Displays detected chords as a horizontal bar above the waveform tracks.
 * Each chord segment is sized proportionally to its duration.
 * The active chord (at current playhead position) is highlighted.
 */

import { useMemo } from 'react';
import './ChordTimeline.css';

/**
 * Determine chord quality from label for color coding.
 */
function getChordQuality(label) {
  if (label === 'N' || !label) return 'no-chord';
  // Minor indicators: 'm', 'dim', 'm7', 'm7b5', 'mMaj7', etc.
  if (/m(?!aj)/i.test(label) || /dim/i.test(label)) return 'minor';
  return 'major';
}

export default function ChordTimeline({ chords, currentTime, duration }) {
  if (!chords || chords.length === 0 || duration <= 0) return null;

  // Find which chord is currently active
  const activeIndex = useMemo(() => {
    for (let i = 0; i < chords.length; i++) {
      if (currentTime >= chords[i].start && currentTime < chords[i].end) {
        return i;
      }
    }
    return -1;
  }, [chords, currentTime]);

  // Calculate playhead position as percentage
  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="chord-timeline" id="chord-timeline">
      {chords.map((chord, index) => {
        const widthPercent = ((chord.end - chord.start) / duration) * 100;
        const quality = getChordQuality(chord.label);
        const isActive = index === activeIndex;
        const isNarrow = widthPercent < 3; // Less than 3% width

        const classNames = [
          'chord-segment',
          quality,
          isActive ? 'active' : '',
          isNarrow ? 'narrow' : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={`${chord.start}-${chord.label}`}
            className={classNames}
            style={{ width: `${widthPercent}%` }}
            title={`${chord.label} (${chord.start.toFixed(1)}s – ${chord.end.toFixed(1)}s)`}
          >
            <span className="chord-label">
              {chord.label === 'N' ? '–' : chord.label}
            </span>
          </div>
        );
      })}

      {/* Playhead line */}
      <div
        className="chord-playhead"
        style={{ left: `${playheadPercent}%` }}
      />
    </div>
  );
}
