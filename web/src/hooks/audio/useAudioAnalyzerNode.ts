'use client';

// Hook responsable únicamente de crear y gestionar el AnalyserNode
// de la Web Audio API y exponer sus buffers de datos en cada frame.
//
// El AnalyserNode es el nodo del grafo de audio que realiza el análisis espectral.
// Se conecta entre la fuente de audio y el destino (altavoces) sin modificar la señal:
//
// AudioBufferSourceNode → AnalyserNode → AudioContext.destination
//
// En cada frame expone dos buffers:
// - getByteFrequencyData:    espectro de frecuencias en Uint8Array [0,255]
// - getFloatTimeDomainData:  forma de onda en Float32Array [-1,1]
//
// Responsabilidad única: gestionar el AnalyserNode y sus buffers.
// Este hook no interpreta los datos — eso es responsabilidad de useAudioLoop.ts.

import { useRef, useCallback, useEffect } from 'react';
import { defaultFFTConfig, FFTConfig } from '@/lib';

// Nodos del grafo de audio gestionados por este hook
export interface AnalyzerNodes {
  // El nodo analizador conectado al grafo
  analyser: AnalyserNode;

  // La fuente de audio actual conectada al analizador.
  // Se reemplaza cada vez que se carga un nuevo archivo.
  source: AudioBufferSourceNode | null;
}

// Buffers de datos expuestos por el analizador en cada frame
export interface AnalyzerBuffers {
  // frequencyData: magnitudes del espectro FFT en Uint8Array.
  // Longitud = fftSize / 2. Cada elemento en rango [0, 255].
  // 0 corresponde a minDecibels, 255 a maxDecibels del AnalyserNode.
  frequencyData: Uint8Array<ArrayBuffer>;

  // waveformData: muestras de la señal en el dominio del tiempo.
  // Longitud = fftSize. Cada elemento en rango [-1, 1].
  // Representa la forma de onda de audio en el instante actual.
  waveformData: Float32Array<ArrayBuffer>;
}

export interface AudioAnalyzerNodeHandle {
  // Crea el AnalyserNode y lo conecta al AudioContext proporcionado.
  // Debe llamarse una vez después de que el AudioContext esté activo.
  initialize: (context: AudioContext, config?: Partial<FFTConfig>) => AnalyserNode;

  // Conecta un AudioBuffer al analizador y comienza la reproducción.
  // Si hay una fuente activa, la detiene primero.
  play: (buffer: AudioBuffer, context: AudioContext, onEnded?: () => void) => void;

  // Detiene la reproducción actual
  stop: () => void;

  // Lee los buffers de datos del analizador en el frame actual.
  // Debe llamarse dentro del loop de requestAnimationFrame.
  readBuffers: () => AnalyzerBuffers | null;

  // Limpia el analizador y desconecta todos los nodos
  dispose: () => void;
}

// Hook que gestiona el AnalyserNode de la Web Audio API.
export function useAudioAnalyzerNode(): AudioAnalyzerNodeHandle {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef   = useRef<AudioBufferSourceNode | null>(null);

  // Buffers pre-alocados para evitar garbage collection en el loop de animación.
  // Se crean una sola vez al inicializar y se reutilizan en cada frame.
  // El tipo explícito <ArrayBuffer> es necesario para compatibilidad con la Web Audio API,
  // que espera ArrayBuffer y no el tipo más amplio ArrayBufferLike.
  const frequencyBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const waveformBufferRef  = useRef<Float32Array<ArrayBuffer> | null>(null);

  // Crea y configura el AnalyserNode.
  // Los parámetros del AnalyserNode determinan la resolución espectral y
  // el rango dinámico del análisis FFT.
  const initialize = useCallback(
    (context: AudioContext, config: Partial<FFTConfig> = {}): AnalyserNode => {
      // Limpiar analizador anterior si existe
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }

      const mergedConfig = { ...defaultFFTConfig, ...config };
      const analyser = context.createAnalyser();

      // fftSize determina la resolución del análisis:
      // Mayor fftSize = más bins de frecuencia = mejor resolución espectral
      // pero mayor latencia temporal (tradeoff tiempo-frecuencia de la FFT)
      analyser.fftSize = mergedConfig.fftSize;

      // smoothingTimeConstant aplica un promedio exponencial entre frames:
      // X_out(t) = α · X_out(t-1) + (1-α) · X_in(t)
      // Suaviza el espectro para evitar cambios abruptos frame a frame
      analyser.smoothingTimeConstant = mergedConfig.smoothingTimeConstant;

      // Rango dinámico en decibelios para la representación Uint8Array
      analyser.minDecibels = mergedConfig.minDecibels;
      analyser.maxDecibels = mergedConfig.maxDecibels;

      // Conectar el analizador al destino (altavoces)
      // La señal pasa a través del analizador sin modificarse
      analyser.connect(context.destination);

      // Pre-alocar los buffers de lectura con el tamaño correcto
      frequencyBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
      waveformBufferRef.current  = new Float32Array(analyser.fftSize);

      analyserRef.current = analyser;
      return analyser;
    },
    []
  );

  // Conecta un AudioBuffer al analizador y comienza la reproducción.
  // AudioBufferSourceNode es de un solo uso — se crea uno nuevo en cada reproducción.
  const play = useCallback(
    (buffer: AudioBuffer, context: AudioContext, onEnded?: () => void): void => {
      if (!analyserRef.current) return;

      // Detener fuente anterior si existe
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
        } catch {
          // La fuente puede ya estar detenida si terminó naturalmente
        }
      }

      // AudioBufferSourceNode: nodo de un solo uso que reproduce un AudioBuffer completo.
      // No puede pausarse ni rebobinarse — para eso se necesita un nuevo nodo.
      const source = context.createBufferSource();
      source.buffer = buffer;

      // Conectar: fuente → analizador (que ya está conectado al destino)
      source.connect(analyserRef.current);

      if (onEnded) {
        source.addEventListener('ended', onEnded, { once: true });
      }

      source.start(0);
      sourceRef.current = source;
    },
    []
  );

  // Detiene la reproducción actual desconectando la fuente
  const stop = useCallback((): void => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch {
        // Ignorar error si la fuente ya estaba detenida
      }
      sourceRef.current = null;
    }
  }, []);

  // Lee los buffers de datos del frame actual.
  // Llamado en cada tick del requestAnimationFrame por useAudioLoop.ts.
  // Retorna null si el analizador no está inicializado.
  const readBuffers = useCallback((): AnalyzerBuffers | null => {
    if (
      !analyserRef.current ||
      !frequencyBufferRef.current ||
      !waveformBufferRef.current
    ) {
      return null;
    }

    // Llenar los buffers pre-alocados con los datos del frame actual.
    // Estas llamadas son síncronas y eficientes — no crean objetos nuevos.
    analyserRef.current.getByteFrequencyData(frequencyBufferRef.current);
    analyserRef.current.getFloatTimeDomainData(waveformBufferRef.current);

    return {
      frequencyData: frequencyBufferRef.current,
      waveformData:  waveformBufferRef.current,
    };
  }, []);

  // Limpia todos los nodos y libera recursos
  const dispose = useCallback((): void => {
    stop();
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    frequencyBufferRef.current = null;
    waveformBufferRef.current  = null;
  }, [stop]);

  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return { initialize, play, stop, readBuffers, dispose };
}