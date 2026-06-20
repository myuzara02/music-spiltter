/**
 * Music Splitter — WebSocket Hook
 *
 * Custom React hook for managing WebSocket connection
 * to the backend for real-time separation progress.
 */

import { useCallback, useRef, useState } from 'react';

const WS_BASE_URL = 'ws://localhost:8000';

export function useWebSocket() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('idle');
  const [currentStem, setCurrentStem] = useState(null);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const connect = useCallback((jobId, model) => {
    // Reset state
    setProgress(0);
    setStage('connecting');
    setCurrentStem(null);
    setMessage('Connecting...');
    setResult(null);
    setError(null);

    const ws = new WebSocket(`${WS_BASE_URL}/ws/progress/${jobId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStage('starting');
      setMessage('Starting separation...');
      // Send start command with model info
      ws.send(JSON.stringify({ model }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        setProgress(data.percent || 0);
        setStage(data.stage || 'processing');
        setCurrentStem(data.current_stem || null);
        setMessage(data.message || '');

        if (data.stage === 'complete' && data.result) {
          setResult(data.result);
        }

        if (data.stage === 'error') {
          setError(data.message || 'An unknown error occurred');
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error. Please check if the backend is running.');
      setStage('error');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    disconnect();
    setProgress(0);
    setStage('idle');
    setCurrentStem(null);
    setMessage('');
    setResult(null);
    setError(null);
  }, [disconnect]);

  return {
    progress,
    stage,
    currentStem,
    message,
    result,
    error,
    connect,
    disconnect,
    reset,
    setResult,
    setStage,
  };
}
