'use client';

// Hook responsable únicamente de la lógica de control de reproducción.
// Lee estado del store directamente en lugar de instanciar useAudioEngine,
// para evitar múltiples instancias del motor de audio en el mismo árbol.

import { useLumyraStore } from '@/store';

export interface AudioControlsHandle {
  playing:    boolean;
  audioReady: boolean;
  fileName:   string | null;
  duration:   number;
  currentTimeFormatted: string;
  durationFormatted:    string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Hook que expone el estado de reproducción a los componentes de UI.
// Las acciones play/stop vienen directamente de useAudioEngine en AudioPanel.
export function useAudioControls(): AudioControlsHandle {
  const audioReady  = useLumyraStore((s) => s.audioReady);
  const playing     = useLumyraStore((s) => s.audioPlaying);
  const fileName    = useLumyraStore((s) => s.audioFileName);
  const duration    = useLumyraStore((s) => s.audioDuration);
  const currentTime = useLumyraStore((s) => s.audioCurrentTime);

  return {
    playing,
    audioReady,
    fileName,
    duration,
    currentTimeFormatted: formatTime(currentTime),
    durationFormatted:    formatTime(duration),
  };
}