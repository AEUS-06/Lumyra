'use client';

// Hook público del sistema de tracking de manos de Lumyra.
// Compone useCameraStream, useMediaPipe y useGestureProcessor
// en una interfaz única que los componentes consumen.

import { useCallback, useEffect, useRef } from 'react';
import { useCameraStream }     from './useCameraStream';
import { useMediaPipe }        from './useMediaPipe';
import { useGestureProcessor } from './useGestureProcessor';
import { useLumyraStore }      from '@/store';

export interface HandEngineHandle {
  start:        () => Promise<void>;
  stop:         () => void;
  videoRef:     React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  loading:      boolean;
  error:        string | null;
}

export function useHandEngine(): HandEngineHandle {
  const cameraStream     = useCameraStream();
  const mediaPipe        = useMediaPipe();
  const gestureProcessor = useGestureProcessor();

  const setHandsDetected = useLumyraStore((s) => s.setHandsDetected);
  const setHandData      = useLumyraStore((s) => s.setHandData);
  const setFieldParams   = useLumyraStore((s) => s.setFieldParams);
  const setCameraActive  = useLumyraStore((s) => s.setCameraActive);

  // Leer fieldParams con getState() para evitar el loop infinito.
  // getState() no suscribe al store ni dispara re-renders.
  const getCurrentFieldParams = useCallback(
    () => useLumyraStore.getState().fieldParams,
    []
  );

  // Ref para stop — evita incluirlo en dependencias de useEffect de cleanup
  // y previene el loop de setState durante el unmount
  const stopRef = useRef<() => void>(() => {});

  const start = useCallback(async (): Promise<void> => {
    await cameraStream.start();
    if (!cameraStream.videoRef.current || cameraStream.error) return;

    await mediaPipe.initialize(
      cameraStream.videoRef.current,
      (mediaPipeResult) => {
        const { handData, fieldParams } = gestureProcessor.process(
          mediaPipeResult,
          getCurrentFieldParams()
        );
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
    getCurrentFieldParams,
    setHandsDetected,
    setHandData,
    setFieldParams,
    setCameraActive,
  ]);

  const stop = useCallback((): void => {
    mediaPipe.dispose();
    cameraStream.stop();
    // Actualizar el store directamente con getState para evitar
    // llamar setState de React durante el cleanup del useEffect
    useLumyraStore.getState().setCameraActive(false);
    useLumyraStore.getState().setHandsDetected(false);
    useLumyraStore.getState().setHandData(null);
  }, [mediaPipe, cameraStream]);

  // Mantener stopRef actualizado sin re-ejecutar el useEffect de cleanup
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Cleanup al desmontar — usa la ref para evitar el loop de setState
  useEffect(() => {
    return () => {
      stopRef.current();
    };
  }, []); // dependencias vacías intencionales — solo se ejecuta al desmontar

  return {
    start,
    stop,
    videoRef:     cameraStream.videoRef,
    cameraActive: cameraStream.active,
    loading:      cameraStream.loading,
    error:        cameraStream.error,
  };
}