'use client';

// Hook responsable únicamente de decodificar un archivo de audio
// desde un File del browser hasta un AudioBuffer listo para reproducir y analizar.
//
// La decodificación convierte los bytes comprimidos del archivo (MP3, WAV, OGG, FLAC)
// en muestras de audio en formato PCM (Pulse Code Modulation) sin comprimir,
// que es el formato que entiende la Web Audio API para procesamiento en tiempo real.
//
// Responsabilidad única: File → AudioBuffer.
// Este hook no sabe nada del AudioContext interno, del store ni del análisis FFT.

import { useState, useCallback } from 'react';

// Estado del proceso de decodificación
export interface AudioDecoderState {
  // El AudioBuffer decodificado. Null hasta que se complete la decodificación.
  buffer: AudioBuffer | null;

  // Nombre del archivo cargado actualmente
  fileName: string | null;

  // Duración del audio en segundos, extraída del AudioBuffer
  duration: number;

  // Verdadero mientras la decodificación está en progreso
  decoding: boolean;

  // Mensaje de error si la decodificación falló. Null si no hay error.
  error: string | null;
}

export interface AudioDecoderHandle extends AudioDecoderState {
  // Decodifica el archivo recibido usando el AudioContext proporcionado.
  // Debe llamarse después de que el AudioContext esté activo (no suspendido).
  decode: (file: File, context: AudioContext) => Promise<AudioBuffer | null>;

  // Limpia el buffer decodificado y resetea el estado
  clear: () => void;
}

// Hook que gestiona la decodificación de archivos de audio.
// Acepta formatos soportados por el browser: MP3, WAV, OGG, FLAC, AAC, M4A.
export function useAudioDecoder(): AudioDecoderHandle {
  const [state, setState] = useState<AudioDecoderState>({
    buffer: null,
    fileName: null,
    duration: 0,
    decoding: false,
    error: null,
  });

  // Decodifica un File del browser en un AudioBuffer.
  //
  // El proceso de decodificación tiene dos pasos:
  // 1. FileReader.readAsArrayBuffer: lee los bytes del archivo en memoria
  // 2. AudioContext.decodeAudioData: decodifica el formato comprimido a PCM
  //
  // El AudioBuffer resultante contiene las muestras en Float32Array por canal,
  // normalizadas en el rango [-1, 1], listas para el AnalyserNode.
  const decode = useCallback(
    async (file: File, context: AudioContext): Promise<AudioBuffer | null> => {
      setState((prev) => ({
        ...prev,
        decoding: true,
        error: null,
        buffer: null,
      }));

      try {
        // Paso 1: leer el archivo como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Paso 2: decodificar el formato comprimido a PCM
        // decodeAudioData es asíncrono porque la decodificación puede tardar
        // para archivos grandes o formatos complejos como MP3 con VBR
        const audioBuffer = await context.decodeAudioData(arrayBuffer);

        setState({
          buffer: audioBuffer,
          fileName: file.name,
          duration: audioBuffer.duration,
          decoding: false,
          error: null,
        });

        return audioBuffer;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al decodificar el archivo de audio';

        setState((prev) => ({
          ...prev,
          buffer: null,
          decoding: false,
          error: message,
        }));

        return null;
      }
    },
    []
  );

  // Limpia el buffer y resetea el estado al estado inicial
  const clear = useCallback(() => {
    setState({
      buffer: null,
      fileName: null,
      duration: 0,
      decoding: false,
      error: null,
    });
  }, []);

  return { ...state, decode, clear };
}