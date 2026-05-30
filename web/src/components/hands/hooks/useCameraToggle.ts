'use client';

// Hook responsable únicamente de la lógica de activar y desactivar
// el tracking de manos desde la UI.
//
// Responsabilidad única: exponer start/stop de la cámara a los componentes
// visuales sin que estos conozcan useHandEngine ni el store directamente.

import { useCallback } from 'react';
import { useHandEngine } from '@/hooks';
import { useLumyraStore } from '@/store';

export interface CameraToggleHandle {
  // Verdadero si la cámara está activa y MediaPipe está procesando
  cameraActive: boolean;

  // Verdadero mientras se espera el permiso del usuario
  loading: boolean;

  // Mensaje de error si el acceso fue denegado
  error: string | null;

  // Activa la cámara e inicia el tracking
  start: () => Promise<void>;

  // Detiene la cámara y el tracking
  stop: () => void;

  // Alterna entre activo y detenido
  toggle: () => Promise<void>;
}

// Hook que expone los controles de cámara a los componentes de UI.
export function useCameraToggle(): CameraToggleHandle {
  const engine       = useHandEngine();
  const cameraActive = useLumyraStore((s) => s.cameraActive);

  const toggle = useCallback(async (): Promise<void> => {
    if (cameraActive) {
      engine.stop();
    } else {
      await engine.start();
    }
  }, [cameraActive, engine]);

  return {
    cameraActive,
    loading:  engine.loading,
    error:    engine.error,
    start:    engine.start,
    stop:     engine.stop,
    toggle,
  };
}