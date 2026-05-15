'use client';

// Hook público del sistema de audio de Lumyra.
// Compone useAudioContext, useAudioDecoder, useAudioAnalyzerNode y useAudioLoop
// en una interfaz única que los componentes consumen.
//
// Este es el único hook de audio que los componentes importan directamente.
// Los hooks internos son detalles de implementación encapsulados aquí.
//
// Responsabilidad única: componer el sistema de audio y conectarlo al store.
// Si cambia useAudioContext, useAudioDecoder, o cualquier hook interno,
// este archivo es el único punto de ajuste — los componentes no cambian.

import { useCallback } from 'react';
import { useAudioContext } from './useAudioContext';
import { useAudioDecoder } from './useAudioDecoder';
import { useAudioAnalyzerNode } from './useAudioAnalyzerNode';
import { useAudioLoop } from './useAudioLoop';
import { useLumyraStore } from '@/store';

// Interfaz pública que los componentes consumen
export interface AudioEngineHandle {
  // Carga y decodifica un archivo de audio. Debe ser llamado desde un evento de usuario.
  loadFile: (file: File) => Promise<void>;

  // Inicia la reproducción del archivo cargado
  play: () => void;

  // Detiene la reproducción
  stop: () => void;

  // Metadatos del estado actual
  fileName:  string | null;
  duration:  number;
  decoding:  boolean;
  playing:   boolean;
  error:     string | null;
}

// Hook público del motor de audio.
// Conecta el sistema de audio al store de Lumyra.
export function useAudioEngine(): AudioEngineHandle {
  const audioContext   = useAudioContext();
  const audioDecoder   = useAudioDecoder();
  const analyzerNode   = useAudioAnalyzerNode();

  // Selectores del store — escritura al store a través de acciones
  const setAudioReady      = useLumyraStore((s) => s.setAudioReady);
  const setAudioPlaying    = useLumyraStore((s) => s.setAudioPlaying);
  const setAudioFileName   = useLumyraStore((s) => s.setAudioFileName);
  const setAudioDuration   = useLumyraStore((s) => s.setAudioDuration);
  const setAudioCurrentTime = useLumyraStore((s) => s.setAudioCurrentTime);
  const setAudioFrame      = useLumyraStore((s) => s.setAudioFrame);
  const setFieldParams     = useLumyraStore((s) => s.setFieldParams);
  const setBeatDetected    = useLumyraStore((s) => s.setBeatDetected);
  const getFieldParams     = useLumyraStore((s) => () => s.fieldParams);

  // El loop recibe callbacks para escribir al store
  // sin importar useLumyraStore directamente
  const audioLoop = useAudioLoop({
    readBuffers:          analyzerNode.readBuffers,
    getCurrentFieldParams: getFieldParams,
    onAudioFrame:         setAudioFrame,
    onFieldParams:        setFieldParams,
    onBeatDetected:       setBeatDetected,
    onCurrentTime:        setAudioCurrentTime,
  });

  // Carga un archivo de audio: crea el contexto, decodifica y prepara el analizador.
  // Debe ser llamado desde un handler de evento de usuario (click, drop, etc.)
  // para cumplir con la política de autoplay del browser.
  const loadFile = useCallback(
    async (file: File): Promise<void> => {
      // 1. Asegurar que el AudioContext está activo
      const context = await audioContext.resume();

      // 2. Inicializar el AnalyserNode si es la primera vez
      analyzerNode.initialize(context);

      // 3. Decodificar el archivo a AudioBuffer
      const buffer = await audioDecoder.decode(file, context);
      if (!buffer) return;

      // 4. Actualizar el store con los metadatos del archivo
      setAudioFileName(file.name);
      setAudioDuration(buffer.duration);
      setAudioReady(true);
    },
    [audioContext, analyzerNode, audioDecoder, setAudioFileName, setAudioDuration, setAudioReady]
  );

  // Inicia la reproducción del AudioBuffer decodificado
  const play = useCallback((): void => {
    if (!audioDecoder.buffer || !audioContext.context) return;

    analyzerNode.play(audioDecoder.buffer, audioContext.context, () => {
      // Callback cuando el audio termina naturalmente
      audioLoop.stop();
      setAudioPlaying(false);
    });

    audioLoop.start(audioContext.context);
    setAudioPlaying(true);
  }, [audioDecoder.buffer, audioContext.context, analyzerNode, audioLoop, setAudioPlaying]);

  // Detiene la reproducción y el loop de análisis
  const stop = useCallback((): void => {
    analyzerNode.stop();
    audioLoop.stop();
    setAudioPlaying(false);
  }, [analyzerNode, audioLoop, setAudioPlaying]);

  return {
    loadFile,
    play,
    stop,
    fileName: audioDecoder.fileName,
    duration: audioDecoder.duration,
    decoding: audioDecoder.decoding,
    playing:  audioLoop.isRunning,
    error:    audioDecoder.error,
  };
}