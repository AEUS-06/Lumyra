'use client';

// Componente visual de un tab individual en la barra superior.
//
// Responsabilidad única: renderizar un tab con su estado activo/inactivo.
// No gestiona el estado del modo — recibe el estado y el handler como props.

import { AppMode } from '@/store/types/app.types';

interface ModeTabProps {
  // Modo que representa este tab
  mode:        AppMode;

  // Etiqueta visible del tab
  label:       string;

  // Verdadero si este tab es el modo activo
  isActive:    boolean;

  // Callback al hacer click
  onClick:     (mode: AppMode) => void;
}

export function ModeTab({ mode, label, isActive, onClick }: ModeTabProps) {
  return (
    <button
      onClick={() => onClick(mode)}
      style={{
        height:        '100%',
        padding:       '0 18px',
        background:    'transparent',
        border:        'none',
        borderRight:   '0.5px solid #0d1a26',
        cursor:        'pointer',
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         isActive ? '#fff' : '#2a4a6a',
        borderBottom:  isActive ? '1px solid #3a8fff' : '1px solid transparent',
        transition:    'color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}