'use client';

// Componente visual del área de drag & drop para archivos de audio.
//
// Responsabilidad única: renderizar el área de drop y sus estados visuales.
// No gestiona eventos ni valida archivos — recibe handlers ya procesados
// de useFileDrop.ts como props.

import { useRef } from 'react';
import { FileDropHandle } from './hooks/useFileDrop';

interface AudioDropZoneProps {
  // Handlers de drag & drop ya procesados por useFileDrop
  dropHandlers: FileDropHandle;

  // Verdadero si ya hay un archivo cargado (cambia el mensaje)
  hasFile: boolean;
}

export function AudioDropZone({ dropHandlers, hasFile }: AudioDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isDraggingOver,
    error,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onFileInput,
  } = dropHandlers;

  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border:        `1px dashed ${isDraggingOver ? '#3a8fff' : '#1a2a3a'}`,
        borderRadius:  4,
        padding:       '12px 16px',
        cursor:        'pointer',
        textAlign:     'center',
        background:    isDraggingOver ? 'rgba(58,143,255,0.06)' : 'transparent',
        transition:    'all 0.15s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={onFileInput}
        style={{ display: 'none' }}
      />

      <p style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize:   10,
        color:      isDraggingOver ? '#3a8fff' : '#3a4a5a',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin:     0,
      }}>
        {isDraggingOver
          ? 'soltar archivo'
          : hasFile
          ? 'cargar otro archivo'
          : 'drag · wav · mp3 · ogg · flac'}
      </p>

      {error && (
        <p style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize:   10,
          color:      '#ff4444',
          marginTop:  4,
          margin:     '4px 0 0',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}