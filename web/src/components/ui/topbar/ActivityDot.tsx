'use client';

// Punto de actividad — se ilumina y pulsa cuando el audio está reproduciéndose.
// Responsabilidad única: este indicador únicamente.

import { useLumyraStore } from '@/store';

export function ActivityDot() {
  const audioPlaying = useLumyraStore((s) => s.audioPlaying);

  return (
    <div style={{
      width:        6,
      height:       6,
      borderRadius: '50%',
      background:   audioPlaying ? 'var(--color-hot)' : 'var(--color-border-mid)',
      boxShadow:    audioPlaying ? '0 0 10px var(--color-hot)' : 'none',
      animation:    audioPlaying ? 'activity-pulse 1.2s ease-in-out infinite' : 'none',
      transition:   'background 0.3s ease, box-shadow 0.3s ease',
      flexShrink:   0,
    }} />
  );
}
