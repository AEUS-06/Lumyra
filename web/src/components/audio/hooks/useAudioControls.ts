'use client';

// Hook responsable únicamente de la lógica de control de reproducción.
//
// Responsabilidad única: leer el estado de reproducción del store
// y exponer las acciones play/stop a los componentes visuales.
// No sabe nada de AudioContext ni de cómo funciona el audio internamente.
// Actúa como puente entre el store y los componentes de UI de audio.

import { useCallback } from 'react';
import { useLumyraStore } from '@/store';
import { useAudioEngine } from '@/hooks';

export interface AudioControlsHandle {
  // Estado actual de reproducción
  playing:   boolean;
  audioReady: boolean;
  fileName:  string | null;
  duration:  number;
  decoding:  boolean;
  error:     string | null;

  // Acciones
  play:  () => void;
  stop:  () => void;

  // Tiempo de reproducción formateado como MM:SS
  currentTimeFormatted: string;
  durationFormatted:    string;
}

// Formatea segundos a MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Hook que expone los controles de reproducción a los componentes de UI.
export function useAudioControls(): AudioControlsHandle {
  const audioReady    = useLumyraStore((s) => s.audioReady);
  const playing       = useLumyraStore((s) => s.audioPlaying);
  const fileName      = useLumyraStore((s) => s.audioFileName);
  const duration      = useLumyraStore((s) => s.audioDuration);
  const currentTime   = useLumyraStore((s) => s.audioCurrentTime);

  const engine = useAudioEngine();

  const play = useCallback((): void => {
    engine.play();
  }, [engine]);

  const stop = useCallback((): void => {
    engine.stop();
  }, [engine]);

  return {
    playing,
    audioReady,
    fileName,
    duration,
    decoding:  engine.decoding,
    error:     engine.error,
    play,
    stop,
    currentTimeFormatted: formatTime(currentTime),
    durationFormatted:    formatTime(duration),
  };
}