'use client';

// Hook con la lógica de dibujo del skeleton de las manos en canvas 2D.
//
// Responsabilidad única: dibujar los 21 landmarks y sus conexiones
// en un CanvasRenderingContext2D dado.
// No gestiona el elemento canvas — solo dibuja en él.

import { useCallback } from 'react';
import { HandData, LandmarkPoint, HandGesture } from '@/store/types/hands.types';

// Conexiones entre landmarks que forman el skeleton de la mano.
// Cada par [a, b] define una línea entre el landmark a y el landmark b.
// Basado en la topología de MediaPipe Hands.
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],         // pulgar
  [0, 5], [5, 6], [6, 7], [7, 8],         // índice
  [0, 9], [9, 10], [10, 11], [11, 12],    // medio
  [0, 13], [13, 14], [14, 15], [15, 16],  // anular
  [0, 17], [17, 18], [18, 19], [19, 20],  // meñique
  [5, 9], [9, 13], [13, 17],              // palma
];

// Color del skeleton según el gesto activo.
// Cada gesto tiene un color que refuerza la retroalimentación visual.
function gestureColor(gesture: HandGesture): string {
  switch (gesture) {
    case 'pinch':   return '#00f0c0'; // cian — creando una fuente de carga
    case 'open':    return '#3a8fff'; // azul eléctrico — expandiendo el campo
    case 'closed':  return '#a050ff'; // violeta — comprimiendo energía
    case 'point':   return '#ffffff'; // blanco — dirigiendo la corriente
    case 'victory': return '#00f0c0'; // cian — interferencia entre dos fuentes
    default:        return '#3a8fff'; // azul eléctrico — estado neutral
  }
}

export interface HandDrawHandle {
  draw: (
    ctx:      CanvasRenderingContext2D,
    handData: HandData,
    width:    number,
    height:   number
  ) => void;

  clear: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

// Dibuja los landmarks y conexiones de una mano
function drawHand(
  ctx:       CanvasRenderingContext2D,
  landmarks: LandmarkPoint[],
  gesture:   HandGesture,
  width:     number,
  height:    number
): void {
  const color = gestureColor(gesture);

  // Dibujar conexiones del skeleton
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = 0.6;

  for (const [a, b] of HAND_CONNECTIONS) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    ctx.beginPath();
    ctx.moveTo(lmA.x * width, lmA.y * height);
    ctx.lineTo(lmB.x * width, lmB.y * height);
    ctx.stroke();
  }

  // Dibujar landmarks como puntos
  ctx.globalAlpha = 0.9;
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// Hook que encapsula la lógica de dibujo del skeleton de manos.
export function useHandDraw(): HandDrawHandle {
  const clear = useCallback((
    ctx:    CanvasRenderingContext2D,
    width:  number,
    height: number
  ): void => {
    ctx.clearRect(0, 0, width, height);
  }, []);

  const draw = useCallback((
    ctx:      CanvasRenderingContext2D,
    handData: HandData,
    width:    number,
    height:   number
  ): void => {
    clear(ctx, width, height);

    if (handData.left?.detected) {
      drawHand(ctx, handData.left.landmarks, handData.left.gesture, width, height);
    }

    if (handData.right?.detected) {
      drawHand(ctx, handData.right.landmarks, handData.right.gesture, width, height);
    }
  }, [clear]);

  return { draw, clear };
}