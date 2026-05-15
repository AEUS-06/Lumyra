'use client';

// Hook responsable únicamente de instanciar, configurar y ejecutar MediaPipe Hands.
//
// MediaPipe Hands es un modelo de machine learning que detecta hasta dos manos
// en un frame de video y devuelve 21 landmarks por mano en coordenadas normalizadas.
// Corre completamente en el browser usando WebAssembly y WebGL — no hay servidor.
//
// El ciclo de procesamiento es:
// 1. MediaPipe toma un frame del elemento <video>
// 2. El modelo ML detecta manos y calcula los 21 landmarks por mano
// 3. Se invoca el callback onResults con los resultados del frame
// 4. El loop llama send() en el siguiente frame via requestAnimationFrame
//
// Responsabilidad única: gestionar la instancia de MediaPipe Hands y su loop.
// Este hook no interpreta los landmarks — eso es responsabilidad de useGestureProcessor.ts.

import { useRef, useCallback, useEffect } from 'react';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { LandmarkPoint } from '@/store/types/hands.types';

// Configuración de MediaPipe Hands.
// El modelo puede detectar hasta dos manos simultáneamente.
// La complejidad del modelo afecta la precisión y el rendimiento:
// 0 = modelo ligero (mejor rendimiento), 1 = modelo completo (mejor precisión)
const MEDIAPIPE_CONFIG = {
  locateFile: (file: string) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
};

const HANDS_CONFIG = {
  // Número máximo de manos a detectar simultáneamente
  maxNumHands: 2,

  // Complejidad del modelo: 0 (lite) o 1 (full)
  // Se usa 1 para mejor precisión en los gestos de Lumyra
  modelComplexity: 1 as 0 | 1,

  // Umbral mínimo de confianza para considerar que se detectó una mano
  // Valores más altos reducen falsos positivos pero pueden perder detecciones
  minDetectionConfidence: 0.7,

  // Umbral mínimo de confianza para continuar trackeando una mano entre frames
  // Puede ser más bajo que minDetectionConfidence para mantener tracking estable
  minTrackingConfidence: 0.5,
};

// Resultado procesado de un frame de MediaPipe
export interface MediaPipeFrameResult {
  // Landmarks de la mano izquierda. Null si no se detectó.
  leftHandLandmarks:  LandmarkPoint[] | null;

  // Landmarks de la mano derecha. Null si no se detectó.
  rightHandLandmarks: LandmarkPoint[] | null;

  // Verdadero si al menos una mano fue detectada en este frame
  handsDetected: boolean;
}

// Callback invocado en cada frame con los resultados de MediaPipe
export type MediaPipeResultCallback = (result: MediaPipeFrameResult) => void;

export interface MediaPipeHandle {
  // Inicializa MediaPipe Hands y comienza el loop de procesamiento.
  // videoElement: el elemento <video> con el stream de la cámara activo.
  // onResults: callback invocado en cada frame con los landmarks detectados.
  initialize: (
    videoElement: HTMLVideoElement,
    onResults: MediaPipeResultCallback
  ) => Promise<void>;

  // Detiene el loop de procesamiento y libera recursos de MediaPipe
  dispose: () => void;

  // Verdadero si MediaPipe está inicializado y procesando frames
  isRunning: boolean;
}

// Hook que gestiona la instancia de MediaPipe Hands.
export function useMediaPipe(): MediaPipeHandle {
  const handsRef   = useRef<Hands | null>(null);
  const cameraRef  = useRef<Camera | null>(null);
  const isRunningRef = useRef(false);

  // Convierte los resultados crudos de MediaPipe al formato interno LandmarkPoint[].
  // MediaPipe devuelve los landmarks como objetos {x, y, z} en [0,1].
  // La etiqueta de lateralidad ('Left' / 'Right') indica la mano desde
  // la perspectiva del modelo, que es la imagen especular de la cámara frontal:
  // 'Left' en MediaPipe = mano derecha del usuario (imagen espejo)
  const processResults = useCallback(
    (
      results: Results,
      onResults: MediaPipeResultCallback
    ): void => {
      let leftHandLandmarks:  LandmarkPoint[] | null = null;
      let rightHandLandmarks: LandmarkPoint[] | null = null;

      if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
          const handedness = results.multiHandedness[index];

          // MediaPipe usa imagen espejo para la cámara frontal:
          // 'Left' del modelo = mano derecha del usuario y viceversa
          const isLeftHand = handedness.label === 'Right';

          const processedLandmarks: LandmarkPoint[] = landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          }));

          if (isLeftHand) {
            leftHandLandmarks = processedLandmarks;
          } else {
            rightHandLandmarks = processedLandmarks;
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

  // Inicializa MediaPipe Hands y comienza el loop de procesamiento.
  // La Camera de @mediapipe/camera_utils gestiona el loop de frames
  // llamando a hands.send() en cada frame del video.
  const initialize = useCallback(
    async (
      videoElement: HTMLVideoElement,
      onResults: MediaPipeResultCallback
    ): Promise<void> => {
      if (isRunningRef.current) return;

      // Crear la instancia de MediaPipe Hands
      const hands = new Hands(MEDIAPIPE_CONFIG);
      hands.setOptions(HANDS_CONFIG);

      // Registrar el callback de resultados
      hands.onResults((results: Results) => {
        processResults(results, onResults);
      });

      await hands.initialize();
      handsRef.current = hands;

      // Camera de MediaPipe gestiona el loop de captura de frames.
      // En cada frame llama a hands.send({ image: videoElement })
      // que procesa el frame y dispara el callback onResults.
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
      cameraRef.current  = camera;
      isRunningRef.current = true;
    },
    [processResults]
  );

  // Detiene el loop y libera los recursos de MediaPipe
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
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    initialize,
    dispose,
    get isRunning() {
      return isRunningRef.current;
    },
  };
}