'use client';

// Hook responsable únicamente del loop de análisis de audio por frame.
//
// El loop de animación es el corazón del modo audio: en cada frame lee los buffers
// del AnalyserNode, procesa los datos con la lib de audio y escribe los resultados
// al store para que el canvas y la UI reaccionen en tiempo real.
//
// El loop usa requestAnimationFrame para sincronizarse con el ciclo de renderizado
// del browser (~60fps), garantizando que el canvas se actualice con los datos
// más recientes sin desperdiciar CPU cuando la pestaña está en segundo plano.
//
// Responsabilidad única: orquestar el análisis frame a frame.
// Este hook no gestiona el AudioContext, el AnalyserNode ni el store directamente —
// recibe funciones para cada una de esas responsabilidades como parámetros.

import { useRef, useCallback } from 'react';
import { extractBands, detectBeat, audioBandsToFieldParams, applyBeatPulse } from '@/lib';
import {
  defaultFFTConfig,
  defaultBeatDetectorConfig,
  defaultAudioMappingConfig,
  initialBeatDetectorState,
  BeatDetectorState,
} from '@/lib';
import { AudioFrame } from '@/store/types/audio.types';
import { FieldParams } from '@/store/types/field.types';
import { AnalyzerBuffers } from './useAudioAnalyzerNode';

// Dependencias externas que el loop necesita para funcionar.
// Se pasan como parámetros para mantener el hook desacoplado del store
// y facilitar el testing.
export interface AudioLoopDependencies {
  // Función para leer los buffers del AnalyserNode en el frame actual
  readBuffers: () => AnalyzerBuffers | null;

  // Función para obtener los FieldParams actuales del store
  getCurrentFieldParams: () => FieldParams;

  // Callbacks para escribir al store — el loop no importa useLumyraStore directamente
  onAudioFrame:    (frame: AudioFrame) => void;
  onFieldParams:   (params: FieldParams) => void;
  onBeatDetected:  (detected: boolean) => void;
  onCurrentTime:   (time: number) => void;
}

export interface AudioLoopHandle {
  // Inicia el loop de análisis. Debe llamarse cuando el audio comienza a reproducirse.
  start: (audioContext: AudioContext) => void;

  // Detiene el loop de análisis. Debe llamarse cuando el audio se detiene o pausa.
  stop: () => void;

  // Verdadero si el loop está activo
  isRunning: boolean;
}

// Hook que gestiona el loop de análisis de audio frame a frame.
export function useAudioLoop(deps: AudioLoopDependencies): AudioLoopHandle {
  const animFrameRef      = useRef<number | null>(null);
  const isRunningRef      = useRef(false);
  const beatStateRef      = useRef<BeatDetectorState>(initialBeatDetectorState);
  const frameTimestampRef = useRef<number>(0);

  // El loop principal de análisis.
  // Se llama en cada frame del browser mientras el audio está reproduciéndose.
  //
  // Ciclo por frame:
  // 1. Leer buffers crudos del AnalyserNode (FFT + waveform)
  // 2. Extraer bandas de frecuencia desde el espectro FFT
  // 3. Detectar si hay un transiente (beat) en este frame
  // 4. Mapear las bandas a parámetros del campo electromagnético
  // 5. Aplicar el pulso de beat si se detectó uno
  // 6. Escribir AudioFrame y FieldParams al store
  // 7. Programar el siguiente frame
  const tick = useCallback(
    (timestamp: number, audioContext: AudioContext) => {
      if (!isRunningRef.current) return;

      const buffers = deps.readBuffers();

      if (buffers) {
        // Paso 2: extraer bandas de frecuencia desde el espectro FFT
        const bands = extractBands(buffers.frequencyData, defaultFFTConfig);

        // Paso 3: detectar transiente comparando energía actual con historia
        const beatResult = detectBeat(
          buffers.waveformData,
          beatStateRef.current,
          defaultBeatDetectorConfig
        );
        beatStateRef.current = beatResult.nextState;

        // Paso 4: mapear bandas espectrales a parámetros del campo
        let newFieldParams = audioBandsToFieldParams(
          bands,
          deps.getCurrentFieldParams(),
          defaultAudioMappingConfig
        );

        // Paso 5: amplificar transitoriamente el campo si hay un beat
        if (beatResult.isBeat) {
          newFieldParams = applyBeatPulse(newFieldParams, beatResult.currentEnergy);
        }

        // Paso 6a: construir el AudioFrame con todos los datos del frame
        const audioFrame: AudioFrame = {
          waveform:      buffers.waveformData,
          frequencyData: buffers.frequencyData,
          rms:           beatResult.currentEnergy,
          bands,
          timestamp,
        };

        // Paso 6b: escribir al store a través de los callbacks
        deps.onAudioFrame(audioFrame);
        deps.onFieldParams(newFieldParams);
        deps.onBeatDetected(beatResult.isBeat);
        deps.onCurrentTime(audioContext.currentTime);
      }

      // Paso 7: programar el siguiente frame
      animFrameRef.current = requestAnimationFrame((ts) => tick(ts, audioContext));
    },
    [deps]
  );

  // Inicia el loop de análisis
  const start = useCallback(
    (audioContext: AudioContext): void => {
      if (isRunningRef.current) return;

      isRunningRef.current = true;
      beatStateRef.current = initialBeatDetectorState;
      animFrameRef.current = requestAnimationFrame((ts) => tick(ts, audioContext));
    },
    [tick]
  );

  // Detiene el loop de análisis y cancela el frame pendiente
  const stop = useCallback((): void => {
    isRunningRef.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  return {
    start,
    stop,
    get isRunning() {
      return isRunningRef.current;
    },
  };
}