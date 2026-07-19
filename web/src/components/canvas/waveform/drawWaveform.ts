// Renderizado de la viñeta de forma de onda del audio.
//
// Responsabilidad única: pintar el waveform como una viñeta de cómic —
// marco oscuro, línea de tinta blanca, sin degradados ni blur.
//
// La posición se calcula respetando el ancho del panel de audio y
// la altura del strip de parámetros, para no quedar tapada por la UI.

import { Ctx2D, comicFrame, rgba, WHITE } from '../pictoric';
import { AudioFrame } from '@/store/types/audio.types';

// Configuración de layout — coincide con las dimensiones reales
// del panel de audio y el strip inferior definidos en components/audio y components/ui.
const MARGIN        = 16;
const FRAME_HEIGHT  = 52;
const PANEL_WIDTH   = 220;
const STRIP_HEIGHT  = 48;

// Dibuja la viñeta del waveform en la esquina inferior derecha del canvas,
// evitando el panel de audio (izquierda) y el strip de parámetros (abajo).
export function drawWaveform(
  ctx:   Ctx2D,
  W:     number,
  H:     number,
  frame: AudioFrame | null
): void {
  if (!frame) return;

  const frameX = PANEL_WIDTH + MARGIN;
  const frameW = W - PANEL_WIDTH - MARGIN * 2;
  const frameY = H - STRIP_HEIGHT - FRAME_HEIGHT - MARGIN;

  if (frameW <= 0) return;

  comicFrame(ctx, frameX, frameY, frameW, FRAME_HEIGHT, 0.8);

  const data   = frame.waveform;
  const midY   = frameY + FRAME_HEIGHT / 2;
  const scaleY = (FRAME_HEIGHT / 2) * 0.72;
  const stepX  = frameW / data.length;

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = frameX + i * stepX;
    const y = midY + data[i] * scaleY;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = rgba(WHITE, 0.65);
  ctx.lineWidth   = 1;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Línea base central, muy sutil
  ctx.beginPath();
  ctx.moveTo(frameX, midY);
  ctx.lineTo(frameX + frameW, midY);
  ctx.strokeStyle = rgba(WHITE, 0.05);
  ctx.lineWidth   = 0.5;
  ctx.stroke();
}