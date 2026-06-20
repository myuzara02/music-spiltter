/**
 * Music Splitter — DAW Player
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import ChordTimeline from './ChordTimeline';
import './MultiTrackPlayer.css';

// SVG Icons
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const RewindIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>;
const LoopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>;
const BackIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const SeparateIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const ExportIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const ZoomInIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></svg>;
const ZoomOutIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>;
const MetronomeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7h2v2.5z"/></svg>;

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PanKnob = ({ value, onChange }) => {
  const knobRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY; // up is positive
    const sensitivity = 0.01;
    let newVal = startVal.current + deltaY * sensitivity;
    newVal = Math.max(-1, Math.min(1, newVal));
    onChange(newVal);
  };

  const onPointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const rotation = value * 135;

  return (
    <div 
      className="knob-container" 
      ref={knobRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => onChange(0)}
      style={{ touchAction: 'none', cursor: 'ns-resize', display: 'flex', justifyContent: 'center' }}
      title="Drag up/down to pan. Double click to center."
    >
      <svg viewBox="0 0 32 32" fill="none" width="28" height="28" style={{ transform: `rotate(${rotation}deg)` }}>
        <circle cx="16" cy="16" r="14" fill="#222" stroke="#444" strokeWidth="2" />
        <line x1="16" y1="16" x2="16" y2="4" stroke="#00BCD4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

function TrackControl({ stem, volume, onVolumeChange, isMuted, onMuteToggle, isSolo, onSoloToggle, pan, onPanChange }) {
  return (
    <div className="daw-track-header">
      <div className="track-ms">
        <button 
          className={`btn-ms ${isMuted ? 'active-m' : ''}`}
          onClick={onMuteToggle}
        >M</button>
        <button 
          className={`btn-ms ${isSolo ? 'active-s' : ''}`}
          onClick={onSoloToggle}
        >S</button>
      </div>
      
      <div className="track-name">{stem.name}</div>
      
      <div className="track-controls-right">
        <div className="track-knob">
          <PanKnob value={pan} onChange={onPanChange} />
          <div className="knob-label" style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: pan < -0.1 ? '#00BCD4' : 'inherit' }}>L</span>
            <span style={{ color: pan > 0.1 ? '#00BCD4' : 'inherit' }}>R</span>
          </div>
        </div>
        <div className="track-volume">
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume} 
            onChange={(e) => onVolumeChange(stem.name, parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

function TrackWaveform({ stem, isMaster, onReady, onPlayPause, onSeek, effectiveVolume, timelineRef, pan }) {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const pannerRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const plugins = [];
    if (isMaster && timelineRef.current) {
      plugins.push(TimelinePlugin.create({
        container: timelineRef.current,
        height: 24,
        timeInterval: 0.1,
        primaryLabelInterval: 10,
        style: {
          fontSize: '10px',
          color: '#888',
        }
      }));
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#008394',
      progressColor: '#00BCD4',
      cursorColor: '#ffffff',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 100,
      normalize: true,
      interact: isMaster,
      plugins
    });

    wsRef.current = ws;

    ws.load(`http://localhost:8000${stem.download_url}`).catch((err) => {
      if (err.name !== 'AbortError') console.error(err);
    });

    ws.on('ready', () => {
      try {
        const media = ws.getMediaElement();
        if (media && !media.__hasPanner) {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          const source = audioCtxRef.current.createMediaElementSource(media);
          gainNodeRef.current = audioCtxRef.current.createGain();
          pannerRef.current = audioCtxRef.current.createStereoPanner();
          
          source.connect(gainNodeRef.current);
          gainNodeRef.current.connect(pannerRef.current);
          pannerRef.current.connect(audioCtxRef.current.destination);
          
          media.__hasPanner = true;
          
          // Initial states
          gainNodeRef.current.gain.value = effectiveVolume;
          pannerRef.current.pan.value = pan;
        }
      } catch (err) {
        console.warn('Could not setup audio graph', err);
      }
      if (onReady) onReady(ws, stem.name);
    });

    if (isMaster) {
      ws.on('play', () => onPlayPause(true));
      ws.on('pause', () => onPlayPause(false));
      ws.on('timeupdate', (time) => onSeek(time));
      ws.on('seeking', (time) => onSeek(time));
    }

    return () => {
      ws.destroy();
    };
  }, [stem.download_url, isMaster, stem.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.setVolume(effectiveVolume);
    }
    if (gainNodeRef.current) {
      // Force immediate volume change to avoid AudioContext suspension scheduling bugs
      gainNodeRef.current.gain.value = effectiveVolume;
    }
  }, [effectiveVolume]);

  useEffect(() => {
    if (pannerRef.current) {
      // Force immediate pan change to avoid AudioContext suspension scheduling bugs
      pannerRef.current.pan.value = pan;
    }
  }, [pan]);

  return (
    <div className="daw-track-wave">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

const playMetronomeClick = (audioCtx, time, isDownbeat) => {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(isDownbeat ? 1000 : 800, time);
    
    gainNode.gain.setValueAtTime(0.5, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    osc.start(time);
    osc.stop(time + 0.05);
  } catch (e) {
    console.warn("Failed to play metronome click:", e);
  }
};

export default function MultiTrackPlayer({ stems, jobId, onReset, onDownloadAll, chords, beats, bpm }) {
  const timelineRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const audioContextRef = useRef(null);
  const nextBeatIndexRef = useRef(0);
  const flashTimeoutRef = useRef(null);

  // Auto-scroll follow variables
  const [autoScrollSuspended, setAutoScrollSuspended] = useState(false);
  const userScrollTimeoutRef = useRef(null);
  const expectedScrollLeftRef = useRef(0);
  const zoomChangeBypassRef = useRef(false);

  // Set bypass when zoom changes to prevent scroll triggers
  useEffect(() => {
    zoomChangeBypassRef.current = true;
    const timer = setTimeout(() => {
      zoomChangeBypassRef.current = false;
      if (scrollContainerRef.current) {
        expectedScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
      }
    }, 150); // 150ms bypass window after zoom change
    return () => clearTimeout(timer);
  }, [zoom]);

  // Handle touchpad pinch and Cmd/Ctrl + Scroll Zoom shortcuts
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scrollLeft = container.scrollLeft;
        
        const zoomFactor = -e.deltaY * 0.005;
        
        setZoom(prev => {
          const nextZoom = Math.max(1, Math.min(8, prev + zoomFactor));
          if (nextZoom !== prev) {
            const ratio = nextZoom / prev;
            const newScrollLeft = ratio * (scrollLeft + mouseX) - mouseX;
            requestAnimationFrame(() => {
              expectedScrollLeftRef.current = Math.round(newScrollLeft);
              container.scrollLeft = newScrollLeft;
            });
          }
          return nextZoom;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Listen to manual scroll events to temporarily suspend auto-scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (zoomChangeBypassRef.current) {
        expectedScrollLeftRef.current = container.scrollLeft;
        return;
      }

      const currentScroll = container.scrollLeft;
      const expectedScroll = expectedScrollLeftRef.current;
      const difference = Math.abs(currentScroll - expectedScroll);

      // If actual scroll position deviates from programmatically set scroll position
      // by more than a small threshold (e.g. 5px), the user has scrolled manually.
      if (difference > 5) {
        // User scrolled manually, suspend auto-scroll
        setAutoScrollSuspended(true);

        // Clear previous timeout and set a new one for 3 seconds of inactivity
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
        }
        userScrollTimeoutRef.current = setTimeout(() => {
          expectedScrollLeftRef.current = container.scrollLeft;
          setAutoScrollSuspended(false);
        }, 3000);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Reset suspension state if playback is paused/reset
  useEffect(() => {
    if (!isPlaying) {
      setAutoScrollSuspended(false);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    }
  }, [isPlaying]);

  // Auto-scroll to follow playhead when playing and zoomed in
  useEffect(() => {
    if (!isPlaying || duration <= 0 || zoom <= 1 || autoScrollSuspended) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    
    const playheadX = (currentTime / duration) * scrollWidth;
    
    // Auto-scroll forward only when playhead completely exits the visible viewport (right edge)
    const rightThreshold = scrollLeft + clientWidth;
    
    // Auto-scroll backward only when playhead goes to the left of the visible viewport (left edge)
    const leftThreshold = scrollLeft;
    
    if (playheadX > rightThreshold) {
      expectedScrollLeftRef.current = Math.round(playheadX);
      container.scrollLeft = playheadX;
    } else if (playheadX < leftThreshold) {
      expectedScrollLeftRef.current = Math.round(playheadX);
      container.scrollLeft = playheadX;
    }
  }, [currentTime, duration, isPlaying, zoom, autoScrollSuspended]);

  // Handle metronome ticks and visual flash as playhead progresses
  useEffect(() => {
    if (!isPlaying || !beats || beats.length === 0) return;

    // Initialize AudioContext if enabled
    if (isMetronomeEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioCtx = audioContextRef.current;
    
    // Find next beat index relative to current time
    let nextBeatIndex = nextBeatIndexRef.current;
    
    // If the playhead jumped (seeked) far away, recalculate index
    if (nextBeatIndex >= beats.length || beats[nextBeatIndex] < currentTime - 0.2 || beats[nextBeatIndex] > currentTime + 0.5) {
      nextBeatIndex = beats.findIndex(t => t >= currentTime);
      if (nextBeatIndex === -1) nextBeatIndex = beats.length;
      nextBeatIndexRef.current = nextBeatIndex;
    }

    if (nextBeatIndex < beats.length) {
      const nextBeatTime = beats[nextBeatIndex];
      // If we crossed the next beat time
      if (currentTime >= nextBeatTime) {
        const isDownbeat = nextBeatIndex % 4 === 0;

        if (isMetronomeEnabled && audioCtx) {
          playMetronomeClick(audioCtx, audioCtx.currentTime, isDownbeat);
        }

        // Trigger visual flash
        setIsFlashing(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => {
          setIsFlashing(false);
        }, 120);

        nextBeatIndexRef.current = nextBeatIndex + 1;
      }
    }
  }, [currentTime, isPlaying, beats, isMetronomeEnabled]);

  // Clean up AudioContext & Timeout on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);
  
  const [volumes, setVolumes] = useState(() => {
    const init = {};
    stems.forEach(s => init[s.name] = 1);
    return init;
  });
  
  const [pans, setPans] = useState(() => {
    const init = {};
    stems.forEach(s => init[s.name] = 0);
    return init;
  });

  const [muteds, setMuteds] = useState({});
  const [solos, setSolos] = useState({});

  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.5, 1));
  }, []);

  // Compute current and next chord from playback position
  const currentChordInfo = useMemo(() => {
    if (!chords || chords.length === 0) return { current: null, next: null };
    let currentIdx = -1;
    for (let i = 0; i < chords.length; i++) {
      if (currentTime >= chords[i].start && currentTime < chords[i].end) {
        currentIdx = i;
        break;
      }
    }
    const current = currentIdx >= 0 ? chords[currentIdx] : null;
    // Find next non-'N' chord
    let next = null;
    const searchFrom = currentIdx >= 0 ? currentIdx + 1 : 0;
    for (let i = searchFrom; i < chords.length; i++) {
      if (chords[i].label !== 'N') {
        next = chords[i];
        break;
      }
    }
    return { current, next };
  }, [chords, currentTime]);

  const handleVolumeChange = useCallback((stemName, value) => {
    setVolumes(prev => ({ ...prev, [stemName]: value }));
  }, []);

  const handlePanChange = useCallback((stemName, value) => {
    setPans(prev => ({ ...prev, [stemName]: value }));
  }, []);

  const toggleMute = useCallback((stemName) => {
    setMuteds(prev => ({ ...prev, [stemName]: !prev[stemName] }));
    // Turn off solo if mute is toggled on
    setSolos(prev => {
      if (prev[stemName]) return { ...prev, [stemName]: false };
      return prev;
    });
  }, []);

  const toggleSolo = useCallback((stemName) => {
    setSolos(prev => ({ ...prev, [stemName]: !prev[stemName] }));
    // Turn off mute if solo is toggled on
    setMuteds(prev => {
      if (prev[stemName]) return { ...prev, [stemName]: false };
      return prev;
    });
  }, []);

  const wsInstances = useRef({});

  const handleReady = useCallback((ws, stemName) => {
    wsInstances.current[stemName] = ws;
    if (stemName === stems[0].name) {
      setDuration(ws.getDuration());
    }
  }, [stems]);

  const handlePlayPause = useCallback(() => {
    const isNowPlaying = !isPlaying;
    setIsPlaying(isNowPlaying);
    Object.values(wsInstances.current).forEach((ws) => {
      isNowPlaying ? ws.play() : ws.pause();
    });
  }, [isPlaying]);

  const handleMasterEvent = useCallback((playing) => {
    if (playing !== isPlaying) setIsPlaying(playing);
  }, [isPlaying]);

  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
    const masterWs = wsInstances.current[stems[0].name];
    if (!masterWs) return;
    const progress = time / masterWs.getDuration();
    
    Object.entries(wsInstances.current).forEach(([name, ws]) => {
      if (name !== stems[0].name) {
        if (Math.abs(ws.getCurrentTime() - time) > 0.05) {
          ws.seekTo(progress);
        }
      }
    });
  }, [stems]);

  const anySoloActive = Object.values(solos).some(Boolean);

  const getEffectiveVolume = (stemName) => {
    if (anySoloActive && !solos[stemName]) return 0;
    if (muteds[stemName]) return 0;
    let vol = volumes[stemName];
    return vol !== undefined ? vol : 1;
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleConfirmExport = async () => {
    if (!jobId) return;
    setIsExporting(true);
    
    try {
      const params = new URLSearchParams();
      stems.forEach(stem => {
        params.append(stem.name, getEffectiveVolume(stem.name));
        params.append(`${stem.name}_pan`, pans[stem.name] ?? 0);
      });
      params.append('t', Date.now());

      const response = await fetch(`http://localhost:8000/api/mix/${jobId}?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "custom_mix.wav";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to export mix');
    } finally {
      setIsExporting(false);
    }
  };

  const isDraggingTimeline = useRef(false);

  const handleTimelineInteraction = useCallback((e) => {
    if (duration > 0 && wsInstances.current[stems[0].name]) {
      const rect = timelineRef.current.getBoundingClientRect();
      const progress = (e.clientX - rect.left) / rect.width;
      wsInstances.current[stems[0].name].seekTo(Math.max(0, Math.min(1, progress)));
    }
  }, [duration, stems]);

  const onTimelinePointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingTimeline.current = true;
    handleTimelineInteraction(e);
  }, [handleTimelineInteraction]);

  const onTimelinePointerMove = useCallback((e) => {
    if (isDraggingTimeline.current) {
      handleTimelineInteraction(e);
    }
  }, [handleTimelineInteraction]);

  const onTimelinePointerUp = useCallback((e) => {
    isDraggingTimeline.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const handleSkip = useCallback((seconds) => {
    const masterWs = wsInstances.current[stems[0].name];
    if (!masterWs || duration === 0) return;
    let newTime = masterWs.getCurrentTime() + seconds;
    newTime = Math.max(0, Math.min(newTime, duration));
    masterWs.seekTo(newTime / duration);
  }, [stems, duration]);

  const handleRestart = useCallback(() => {
    const masterWs = wsInstances.current[stems[0].name];
    if (!masterWs) return;
    masterWs.seekTo(0);
  }, [stems]);

  return (
    <div className="daw-layout">
      {/* Top Header */}
      <header className="daw-header">
        <div className="daw-header__left">
          <button className="btn-daw-outline" onClick={onReset} style={{ border: 'none' }}>
            <BackIcon />
          </button>
          <div className="daw-header__title">Music Splitter Project</div>
        </div>
        <div className="daw-header__right">
          <button className="btn-daw-outline" onClick={onReset}>
            <SeparateIcon /> <span className="btn-text">Separate tracks</span>
          </button>
          {/* Dynamic chord display */}
          {chords && chords.length > 0 && (
            <>
              <div className="daw-info-box chord-now">
                <span>Now</span>
                <strong>{currentChordInfo.current && currentChordInfo.current.label !== 'N' ? currentChordInfo.current.label : '–'}</strong>
              </div>
              <div className="daw-info-box chord-next">
                <span>Next</span>
                <strong>{currentChordInfo.next ? currentChordInfo.next.label : '–'}</strong>
              </div>
            </>
          )}
          {/* BPM and Metronome */}
          {bpm && (
            <div className="daw-info-box bpm-box">
              <span>BPM</span>
              <strong>{Math.round(bpm)}</strong>
              <div className={`flash-dot ${isFlashing ? 'active' : ''}`} />
            </div>
          )}
          {beats && beats.length > 0 && (
            <button 
              className={`btn-metronome ${isMetronomeEnabled ? 'active' : ''}`}
              onClick={() => setIsMetronomeEnabled(prev => !prev)}
              title="Toggle Metronome Sound"
            >
              <MetronomeIcon />
            </button>
          )}
          {/* Zoom controls */}
          <div className="daw-zoom-controls">
            <button className="btn-zoom" onClick={handleZoomOut} disabled={zoom <= 1} title="Zoom Out">
              <ZoomOutIcon />
            </button>
            <span className="zoom-level">{zoom.toFixed(1)}x</span>
            <button className="btn-zoom" onClick={handleZoomIn} disabled={zoom >= 8} title="Zoom In">
              <ZoomInIcon />
            </button>
          </div>
          <button className="btn-daw-outline" onClick={onDownloadAll}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" transform="rotate(180, 12, 12)"/></svg> 
            <span className="btn-text">Download All</span>
          </button>
          <button className="btn-daw-outline" onClick={handleExportClick} style={{ borderColor: '#00BCD4', color: '#00BCD4' }}>
            <ExportIcon /> <span className="btn-text">Export Mix</span>
          </button>
        </div>
      </header>

      {/* Main Split View */}
      <div className="daw-workspace">
        <div className="daw-track-controls">
          <div className="daw-timeline" style={{ borderBottom: 'none', height: chords && chords.length > 0 ? '60px' : '24px' }}></div> {/* Spacer for timeline + chord */}
          {stems.map((stem) => (
            <TrackControl
              key={stem.name}
              stem={stem}
              volume={volumes[stem.name] ?? 1}
              onVolumeChange={handleVolumeChange}
              isMuted={muteds[stem.name]}
              onMuteToggle={() => toggleMute(stem.name)}
              isSolo={solos[stem.name]}
              onSoloToggle={() => toggleSolo(stem.name)}
              pan={pans[stem.name] ?? 0}
              onPanChange={(val) => handlePanChange(stem.name, val)}
            />
          ))}
        </div>

        <div className="daw-waveforms" ref={scrollContainerRef} style={{ overflowX: zoom > 1 ? 'auto' : 'hidden' }}>
          <div className="daw-zoom-content" style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
            <div 
              className="daw-timeline" 
              ref={timelineRef}
              onPointerDown={onTimelinePointerDown}
              onPointerMove={onTimelinePointerMove}
              onPointerUp={onTimelinePointerUp}
              style={{ cursor: 'text', position: 'relative' }}
            >
              {duration > 0 && (
                <div 
                  className="playhead-marker" 
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                ></div>
              )}
            </div>
            {/* Chord Timeline */}
            {chords && chords.length > 0 && (
              <ChordTimeline
                chords={chords}
                currentTime={currentTime}
                duration={duration}
              />
            )}
            {stems.map((stem, index) => (
              <TrackWaveform
                key={stem.name}
                stem={stem}
                isMaster={index === 0}
                onReady={handleReady}
                onPlayPause={handleMasterEvent}
                onSeek={handleSeek}
                effectiveVolume={getEffectiveVolume(stem.name)}
                timelineRef={timelineRef}
                pan={pans[stem.name] ?? 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Transport */}
      <div className="daw-transport">
        <div className="transport-buttons">
          <button className="btn-transport" onClick={() => handleSkip(-10)} title="-10s"><RewindIcon /></button>
          <button className="btn-transport play" onClick={handlePlayPause}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="btn-transport" onClick={() => handleSkip(10)} title="+10s"><ForwardIcon /></button>
          <button className="btn-transport" onClick={handleRestart} title="Restart"><LoopIcon /></button>
        </div>
        <div className="transport-time">
          <span>{formatTime(currentTime)}</span>
          <div 
            className="transport-progress"
            onClick={(e) => {
              if (duration > 0 && wsInstances.current[stems[0].name]) {
                const rect = e.currentTarget.getBoundingClientRect();
                const progress = (e.clientX - rect.left) / rect.width;
                wsInstances.current[stems[0].name].seekTo(progress);
              }
            }}
          >
            <div 
              className="transport-progress-fill" 
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {showExportModal && (
        <div className="export-modal-overlay">
          <div className="export-modal">
            <h3>Export Mix Configuration</h3>
            <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '16px' }}>
              Verify the final track volumes before downloading your custom mix.
            </p>
            <div className="export-modal-list">
              {stems.map(stem => {
                const vol = getEffectiveVolume(stem.name);
                const panVal = pans[stem.name] ?? 0;
                let status = 'Active';
                let color = '#00BCD4';
                
                if (vol === 0) {
                  status = 'Muted';
                  color = '#ff5252';
                } else if (solos[stem.name]) {
                  status = 'Soloed';
                  color = '#FFD700';
                }
                
                return (
                  <div key={stem.name} className="export-modal-item">
                    <span className="stem-name">{stem.name}</span>
                    <span className="stem-status" style={{ color }}>
                      {status} ({Math.round(vol * 100)}%)
                      {panVal !== 0 && ` • Pan: ${panVal > 0 ? 'R' : 'L'}${Math.abs(panVal).toFixed(1)}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="export-modal-actions">
              <button className="btn-cancel" onClick={() => setShowExportModal(false)} disabled={isExporting}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleConfirmExport} disabled={isExporting}>
                {isExporting ? <span className="loader"></span> : null}
                {isExporting ? 'Processing...' : 'Confirm Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
