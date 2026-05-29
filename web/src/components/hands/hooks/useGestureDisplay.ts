'use client';

// Hook responsable únicamente de traducir el enum HandGesture
// a representaciones visuales para la UI.
//
// Responsabilidad única: HandGesture → { label, description, color }
// No accede al store ni gestiona estado — es una función de transformación
// envuelta en un hook para consistencia con el resto de la capa de UI.

import { useMemo } from 'react';
import { HandGesture } from '@/store/types/hands.types';

export interface GestureDisplay {
  // Nombre corto del gesto para mostrar en la etiqueta
  label: string;

  // Descripción del efecto físico del gesto en el campo
  description: string;

  // Color asociado al gesto en la paleta de Lumyra
  color: string;
}

// Mapa estático de gesto → display. No cambia en runtime.
const GESTURE_DISPLAY_MAP: Record<HandGesture, GestureDisplay> = {
  open: {
    label:       'abierta',
    description: 'expansión del campo',
    color:       '#3a8fff',
  },
  closed: {
    label:       'puño',
    description: 'compresión de energía',
    color:       '#a050ff',
  },
  pinch: {
    label:       'pinch',
    description: 'fuente puntual de carga',
    color:       '#00f0c0',
  },
  point: {
    label:       'señalar',
    description: 'dirección de corriente J',
    color:       '#ffffff',
  },
  victory: {
    label:       'victoria',
    description: 'interferencia entre dos fuentes',
    color:       '#00f0c0',
  },
  neutral: {
    label:       'neutral',
    description: 'campo en reposo',
    color:       '#2a4a6a',
  },
};

// Hook que retorna el display de un gesto dado.
export function useGestureDisplay(gesture: HandGesture): GestureDisplay {
  // useMemo evita recalcular en cada render — el mapa es estático
  return useMemo(() => GESTURE_DISPLAY_MAP[gesture], [gesture]);
}

// Versión sin hook para uso fuera de componentes React
export function getGestureDisplay(gesture: HandGesture): GestureDisplay {
  return GESTURE_DISPLAY_MAP[gesture];
}