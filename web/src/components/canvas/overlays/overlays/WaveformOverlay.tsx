'use client';

// Componente contenedor del overlay de forma de onda de audio.
//
// Responsabilidad única: gestionar el elemento canvas 2D,
// su ciclo de vida y el loop de dibujo por frame.
// La lógica de dibujo está en useWaveformDraw.ts.
//
// Se posiciona con CSS absolute sobre el canvas 3D de R3F.
// Solo es visible cuando hay audio reproduciéndose.

import { useRef, useEffect } from 'react';
import { useLumyraStore } from '@/store';
import { useWaveformDraw } from './useWaveformDraw';

export function WaveformOverlay() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const audioFrame = useLumyraStore((s) => s.audioFrame);
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
        position:  'absolute',
        bottom:    48,
        left:      0,
        right:     0,
        width:     '100%',
        height:    60,
        pointerEvents: 'none',
        opacity:   0.85,
      }}
    />
  );
}