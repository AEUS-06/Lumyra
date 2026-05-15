'use client';

// Hook público del sistema de tracking de manos de Lumyra.
// Compone useCameraStream, useMediaPipe y useGestureProcessor
// en una interfaz única que los componentes consumen.
//
// Este es el único hook de manos que los componentes importan directamente.
// Los hooks internos son detalles de implementación encapsulados aquí.
//
// Responsabilidad única: componer el sistema de manos y conectarlo al store.
// Si cambia useCameraStream o useMediaPipe, este archivo es el único
// punto de ajuste — los componentes no cambian.

import { useCallback, useEffect } from 'react';
import { useCameraStream } from './useCameraStream';
import { useMediaPipe } from './useMediaPipe';
import { useGestureProcessor } from './useGestureProcessor';
import { useLumyraStore } from '@/store';

// Interfaz pública que los componentes consumen
export interface HandEngineHandle {
  // Activa la cámara e inicia el tracking de manos.
  // Debe llamarse desde un handler de evento de usuario.
  start: () => Promise<void>;

  // Detiene el tracking y apaga la cámara
  stop: () => void;

  // Referencia al elemento <video> para renderizar el feed de la cámara.
  // El componente HandTracker.tsx debe asignar esta ref a su elemento <video>.
  videoRef: React.RefObject<HTMLVideoElement | null>;

  // Estado observable del sistema
  cameraActive: boolean;
  loading:      boolean;
  error:        string | null;
}

// Hook público del motor de tracking de manos.
// Conecta el sistema de manos al store de Lumyra.
export function useHandEngine(): HandEngineHandle {
  const cameraStream     = useCameraStream();
  const mediaPipe        = useMediaPipe();
  const gestureProcessor = useGestureProcessor();

  // Selectores del store — escritura a través de acciones
  const setHandsDetected = useLumyraStore((s) => s.setHandsDetected);
  const setHandData      = useLumyraStore((s) => s.setHandData);
  const setFieldParams   = useLumyraStore((s) => s.setFieldParams);
  const setCameraActive  = useLumyraStore((s) => s.setCameraActive);
  const getFieldParams   = useLumyraStore((s) => () => s.fieldParams);

  // Activa la cámara e inicializa MediaPipe con el callback de procesamiento.
  // El flujo es secuencial:
  // 1. Solicitar acceso a la cámara (getUserMedia)
  // 2. Inicializar MediaPipe con el elemento <video> activo
  // 3. MediaPipe comienza a invocar el callback en cada frame
  const start = useCallback(async (): Promise<void> => {
    // Paso 1: activar el stream de la cámara
    await cameraStream.start();

    if (!cameraStream.videoRef.current || cameraStream.error) return;

    // Paso 2: inicializar MediaPipe con el video activo.
    // El callback se invoca en cada frame con los landmarks detectados.
    await mediaPipe.initialize(
      cameraStream.videoRef.current,
      (mediaPipeResult) => {
        // Paso 3: procesar landmarks → HandData + FieldParams
        const { handData, fieldParams } = gestureProcessor.process(
          mediaPipeResult,
          getFieldParams()
        );

        // Escribir al store para que el canvas y la UI reaccionen
        setHandsDetected(mediaPipeResult.handsDetected);
        setHandData(handData);
        setFieldParams(fieldParams);
      }
    );

    setCameraActive(true);
  }, [
    cameraStream,
    mediaPipe,
    gestureProcessor,
    getFieldParams,
    setHandsDetected,
    setHandData,
    setFieldParams,
    setCameraActive,
  ]);

  // Detiene el tracking, apaga la cámara y limpia el store
  const stop = useCallback((): void => {
    mediaPipe.dispose();
    cameraStream.stop();
    setCameraActive(false);
    setHandsDetected(false);
    setHandData(null);
  }, [mediaPipe, cameraStream, setCameraActive, setHandsDetected, setHandData]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    videoRef:     cameraStream.videoRef,
    cameraActive: cameraStream.active,
    loading:      cameraStream.loading,
    error:        cameraStream.error,
  };
}