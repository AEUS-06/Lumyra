'use client';

// Hook responsable únicamente de instanciar, configurar y ejecutar MediaPipe Hands.
//
// @mediapipe/hands y @mediapipe/camera_utils son librerías CommonJS que exponen
// sus exports como globals en lugar de ES modules.
// Turbopack no puede resolverlas con imports estáticos — se cargan dinámicamente
// en runtime dentro de initialize() para evitar el análisis estático del bundler.
// Los paquetes están marcados como externos en next.config.ts.

import { useRef, useCallback, useEffect } from 'react';
import { LandmarkPoint } from '@/store/types/hands.types';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';

const HANDS_CONFIG = {
  maxNumHands:            2,
  modelComplexity:        1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence:  0.5,
};

export interface MediaPipeFrameResult {
  leftHandLandmarks:  LandmarkPoint[] | null;
  rightHandLandmarks: LandmarkPoint[] | null;
  handsDetected:      boolean;
}

export type MediaPipeResultCallback = (result: MediaPipeFrameResult) => void;

export interface MediaPipeHandle {
  initialize: (
    videoElement: HTMLVideoElement,
    onResults:    MediaPipeResultCallback
  ) => Promise<void>;
  dispose:   () => void;
  isRunning: boolean;
}

// Tipos mínimos para las clases de MediaPipe cargadas dinámicamente
interface MPHands {
  setOptions:  (opts: object) => void;
  onResults:   (cb: (results: any) => void) => void;
  initialize:  () => Promise<void>;
  send:        (input: { image: HTMLVideoElement }) => Promise<void>;
  close:       () => void;
}

interface MPCamera {
  start: () => Promise<void>;
  stop:  () => void;
}

// Carga dinámica de MediaPipe usando require() para evitar el análisis
// estático de Turbopack que no puede resolver los exports CommonJS
async function loadMediaPipe(): Promise<{
  Hands:  new (config: object) => MPHands;
  Camera: new (video: HTMLVideoElement, opts: object) => MPCamera;
}> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const handsModule  = require('@mediapipe/hands');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cameraModule = require('@mediapipe/camera_utils');

  return {
    Hands:  handsModule.Hands  ?? handsModule.default?.Hands  ?? handsModule,
    Camera: cameraModule.Camera ?? cameraModule.default?.Camera ?? cameraModule,
  };
}

export function useMediaPipe(): MediaPipeHandle {
  const handsRef     = useRef<MPHands   | null>(null);
  const cameraRef    = useRef<MPCamera  | null>(null);
  const isRunningRef = useRef(false);

  const processResults = useCallback(
    (results: any, onResults: MediaPipeResultCallback): void => {
      let leftHandLandmarks:  LandmarkPoint[] | null = null;
      let rightHandLandmarks: LandmarkPoint[] | null = null;

      if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandLandmarks.forEach((landmarks: any[], index: number) => {
          const handedness = results.multiHandedness[index];
          // MediaPipe usa imagen espejo: 'Left' del modelo = mano derecha del usuario
          const isLeftHand = handedness.label === 'Right';

          const processed: LandmarkPoint[] = landmarks.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          }));

          if (isLeftHand) {
            leftHandLandmarks = processed;
          } else {
            rightHandLandmarks = processed;
          }
        });
      }

      onResults({
        leftHandLandmarks,
        rightHandLandmarks,
        handsDetected: leftHandLandmarks !== null || rightHandLandmarks !== null,
      });
    },
    []
  );

  const initialize = useCallback(
    async (
      videoElement: HTMLVideoElement,
      onResults:    MediaPipeResultCallback
    ): Promise<void> => {
      if (isRunningRef.current) return;

      const { Hands, Camera } = await loadMediaPipe();

      const hands = new Hands({ locateFile: (file: string) => `${MEDIAPIPE_CDN}/${file}` });
      hands.setOptions(HANDS_CONFIG);
      hands.onResults((results: any) => processResults(results, onResults));
      await hands.initialize();
      handsRef.current = hands;

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (handsRef.current) {
            await handsRef.current.send({ image: videoElement });
          }
        },
        width:  1280,
        height: 720,
      });

      await camera.start();
      cameraRef.current    = camera;
      isRunningRef.current = true;
    },
    [processResults]
  );

  const dispose = useCallback((): void => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    return () => { dispose(); };
  }, [dispose]);

  return {
    initialize,
    dispose,
    get isRunning() { return isRunningRef.current; },
  };
}