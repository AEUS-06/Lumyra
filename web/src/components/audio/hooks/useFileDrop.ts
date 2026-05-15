'use client';

// Hook responsable únicamente de la lógica de drag & drop de archivos.
//
// Responsabilidad única: gestionar los eventos de arrastre del browser
// y validar que el archivo soltado sea un formato de audio soportado.
// No sabe nada de AudioContext, reproducción ni del store.
//
// Los formatos soportados son los que decodifica la Web Audio API
// de forma nativa en los browsers modernos.

import { useState, useCallback, DragEvent } from 'react';

// Formatos de audio aceptados por la Web Audio API en browsers modernos
const ACCEPTED_FORMATS = [
  'audio/mpeg',       // MP3
  'audio/wav',        // WAV
  'audio/ogg',        // OGG
  'audio/flac',       // FLAC
  'audio/aac',        // AAC
  'audio/mp4',        // M4A
  'audio/x-m4a',     // M4A alternativo
];

// Extensiones aceptadas como fallback cuando el MIME type no está disponible
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];

export interface FileDropState {
  // Verdadero mientras un archivo válido está siendo arrastrado sobre la zona
  isDraggingOver: boolean;

  // Mensaje de error si el archivo soltado no es válido
  error: string | null;
}

export interface FileDropHandle extends FileDropState {
  // Handlers para asignar al elemento drop zone
  onDragOver:  (e: DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop:      (e: DragEvent<HTMLDivElement>) => void;

  // Handler para input type="file" como alternativa al drag & drop
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Valida que el archivo sea un formato de audio soportado
function validateAudioFile(file: File): string | null {
  const isValidMime = ACCEPTED_FORMATS.includes(file.type);
  const isValidExt  = ACCEPTED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isValidMime && !isValidExt) {
    return `Formato no soportado. Usa: ${ACCEPTED_EXTENSIONS.join(', ')}`;
  }

  return null;
}

// Hook que gestiona drag & drop de archivos de audio.
// onFile: callback invocado con el archivo validado cuando el usuario lo suelta.
export function useFileDrop(onFile: (file: File) => void): FileDropHandle {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
    // Prevenir el comportamiento por defecto del browser (abrir el archivo)
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragEnter = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
    setError(null);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const validationError = validateAudioFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onFile(file);
    },
    [onFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateAudioFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onFile(file);
    },
    [onFile]
  );

  return {
    isDraggingOver,
    error,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onFileInput,
  };
}