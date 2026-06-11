'use client';

// Overlay de forma de onda de audio.
// Responsabilidad única: canvas 2D con el loop de dibujo.
// Posicionado sobre el canvas 3D de R3F — no compite con su RAF.

import { useRef, useEffect } from 'react';
import { useLumyraStore } from '@/store';
import { useWaveformDraw } from './useWaveformDraw';

export function WaveformOverlay() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const audioFrame   = useLumyraStore((s) => s.audioFrame);
  const audioPlaying = useLumyraStore((s) => s.audioPlaying);
  const { draw, clear } = useWaveformDraw();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!audioPlaying || !audioFrame) {
      clear(ctx, canvas.width, canvas.height);
      return;
    }

    draw(ctx, audioFrame, canvas.width, canvas.height);
  }, [audioFrame, audioPlaying, draw, clear]);

  if (!audioPlaying) return null;

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={60}
      style={{
        position:      'absolute',
        bottom:        'var(--strip-height)',
        left:          0,
        right:         0,
        width:         '100%',
        height:        60,
        pointerEvents: 'none',
        opacity:       0.85,
      }}
    />
  );
}