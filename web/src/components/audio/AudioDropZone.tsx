'use client';

// Zona de drag & drop para archivos de audio.
// Responsabilidad única: estados visuales del drop.

import { useRef } from 'react';
import { FileDropHandle } from './hooks/useFileDrop';

interface AudioDropZoneProps {
  dropHandlers: FileDropHandle;
  hasFile:      boolean;
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
        border:        `1px dashed ${isDraggingOver ? 'var(--color-active)' : 'var(--color-border-mid)'}`,
        padding:       '20px 16px',
        cursor:        'pointer',
        textAlign:     'center',
        background:    isDraggingOver
          ? 'rgba(58,143,255,0.06)'
          : 'transparent',
        transition:    'border-color 0.15s ease, background 0.15s ease',
        /* Sin border-radius — coherente con el lenguaje brutalista */
        borderRadius:  0,
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
        alignItems:    'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={onFileInput}
        style={{ display: 'none' }}
      />

      {/* Ícono */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   18,
        color:      isDraggingOver ? 'var(--color-active)' : 'var(--color-border-mid)',
        lineHeight: 1,
        transition: 'color 0.15s ease',
      }}>
        {isDraggingOver ? '↓' : '♫'}
      </span>

      <p style={{
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      9,
        color:         isDraggingOver ? 'var(--color-active)' : 'var(--color-text-muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin:        0,
        lineHeight:    1.6,
        transition:    'color 0.15s ease',
      }}>
        {isDraggingOver
          ? 'soltar archivo'
          : hasFile
          ? 'cargar otro archivo'
          : 'wav · mp3 · ogg · flac'}
      </p>

      {!isDraggingOver && !hasFile && (
        <p style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      10,
          color:         'var(--color-text-dim)',
          margin:        0,
          fontWeight:    300,
        }}>
          o haz click para explorar
        </p>
      )}

      {error && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   10,
          color:      'var(--color-danger)',
          margin:     0,
        }}>
          {error}
        </p>
      )}
    </div>
  );
}