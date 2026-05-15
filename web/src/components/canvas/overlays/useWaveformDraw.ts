'use client';

// Hook con la lógica de dibujo de la forma de onda de audio en un canvas 2D.
//
// Responsabilidad única: dibujar la waveform en un canvas 2D dado.
// No gestiona el elemento canvas ni el ciclo de vida del componente —
// solo recibe un CanvasRenderingContext2D y dibuja en él.

import { useCallback } from 'react';
import { AudioFrame } from '@/store/types/audio.types';

// Estilo visual de la waveform, coherente con la paleta de Lumyra
const WAVEFORM_STYLE = {
  lineColor:  '#3a8fff',
  glowColor:  'rgba(58, 143, 255, 0.3)',
  lineWidth:  1.5,
  glowWidth:  4,
} as const;

export interface WaveformDrawHandle {
  draw: (
    ctx:   CanvasRenderingContext2D,
    frame: AudioFrame,
    width: number,
    height: number
  ) => void;

  clear: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

// Hook que encapsula la lógica de dibujo de la waveform.
export function useWaveformDraw(): WaveformDrawHandle {
  // Limpia el canvas con transparencia total
  const clear = useCallback((
    ctx:    CanvasRenderingContext2D,
    width:  number,
    height: number
  ): void => {
    ctx.clearRect(0, 0, width, height);
  }, []);

  // Dibuja la forma de onda del frame de audio actual.
  // La waveform se dibuja dos veces: primero con blur para el glow,
  // luego nítida encima para el trazo principal.
  const draw = useCallback((
    ctx:    CanvasRenderingContext2D,
    frame:  AudioFrame,
    width:  number,
    height: number
  ): void => {
    clear(ctx, width, height);

    const data      = frame.waveform;
    const sliceWidth = width / data.length;
    const midY      = height / 2;

    // Primera pasada: glow difuso
    ctx.beginPath();
    ctx.strokeStyle = WAVEFORM_STYLE.glowColor;
    ctx.lineWidth   = WAVEFORM_STYLE.glowWidth;
    ctx.filter      = 'blur(2px)';

    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const y = midY + data[i] * midY * 0.9;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Segunda pasada: trazo principal nítido
    ctx.beginPath();
    ctx.strokeStyle = WAVEFORM_STYLE.lineColor;
    ctx.lineWidth   = WAVEFORM_STYLE.lineWidth;
    ctx.filter      = 'none';

    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const y = midY + data[i] * midY * 0.9;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [clear]);

  return { draw, clear };
}