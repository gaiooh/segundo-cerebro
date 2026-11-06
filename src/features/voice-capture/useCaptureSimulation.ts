import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * VISUAL SIMULATION ONLY — no microphone access, no audio, no transcription.
 * Drives the capture UI states so the experience can be evaluated.
 * Replace with the real recorder (expo-audio) when capture is implemented.
 */
export type CaptureStatus = 'idle' | 'recording' | 'saving';

const BAR_COUNT = 28;

export function useCaptureSimulation(onSaved: (durationSec: number) => void) {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08));
  const startedAt = useRef(0);
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (status !== 'recording') return;
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      // Smooth pseudo-random "voice" envelope, newest level on the right.
      setLevels((current) => {
        const t = Date.now() / 420;
        const next = 0.25 + 0.35 * Math.abs(Math.sin(t)) + 0.4 * Math.random() * Math.abs(Math.sin(t * 2.3));
        return [...current.slice(1), Math.min(1, next)];
      });
    }, 110);
    return () => clearInterval(tick);
  }, [status]);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    setElapsed(0);
    setStatus('recording');
  }, []);

  const stop = useCallback(() => {
    const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    setStatus('saving');
    setLevels(Array(BAR_COUNT).fill(0.08));
    setTimeout(() => {
      setStatus('idle');
      onSavedRef.current(duration);
    }, 900);
  }, []);

  return { status, elapsed, levels, start, stop };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
