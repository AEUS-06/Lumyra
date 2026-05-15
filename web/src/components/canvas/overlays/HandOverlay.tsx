'use client';

// Componente contenedor del overlay del skeleton de manos.
//
// Responsabilidad única: gestionar el elemento canvas 2D
// y su loop de dibujo. La lógica de dibujo está en useHandDraw.ts.
//
// Se posiciona con CSS absolute sobre el canvas 3D de R3F,
// cubriendo el área completa para que los landmarks coincidan
// con las posiciones reales de las manos en el video.
// Solo visible cuando la cámara está activa y hay manos detectadas.

import { useRef, useEffect } from 'react';
import { useLumyraStore } from '@/store';
import { useHandDraw } from './useHandDraw';

export function HandOverlay() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const handData     = useLumyraStore((s) => s.handData);
  const cameraActive = useLumyraStore((s) => s.cameraActive);
  const { draw, clear } = useHandDraw();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!cameraActive || !handData) {
      clear(ctx, canvas.width, canvas.height);
      return;
    }

    draw(ctx, handData, canvas.width, canvas.height);
  }, [handData, cameraActive, draw, clear]);

  if (!cameraActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      style={{
        position:  'absolute',
        top:       0,
        left:      0,
        width:     '100%',
        height:    '100%',
        pointerEvents: 'none',
        opacity:   0.75,
      }}
    />
  );
}