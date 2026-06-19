/**
 * Music Splitter — Results Panel Component
 *
 * Displays separated stems after processing is complete.
 */

import { useState } from 'react';
import MultiTrackPlayer from './MultiTrackPlayer';
import { MixerIcon, SettingsIcon, CheckIcon, getStemIcon } from './icons';
import './ResultsPanel.css';

const API_BASE = 'http://localhost:8000';

export default function ResultsPanel({ result, onReset }) {
  const [activeStem, setActiveStem] = useState('all');

  if (!result || !result.stems) return null;

  const handleDownloadAll = async () => {
    // Basic download all logic
    for (const stem of result.stems) {
      const link = document.createElement('a');
      link.href = `${API_BASE}${stem.download_url}`;
      link.download = stem.filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Brief pause to not crash browser
      await new Promise(r => setTimeout(r, 300));
    }
  };

  return (
    <div className="daw-wrapper">
      <MultiTrackPlayer 
        stems={result.stems} 
        jobId={result.job_id} 
        onDownloadAll={handleDownloadAll} 
        onReset={onReset} 
      />
    </div>
  );
}
