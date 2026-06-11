'use client';

// Componente visual de un tab individual en la barra superior.
// Responsabilidad única: renderizar el estado activo/inactivo del tab.

import { AppMode } from '@/store/types/app.types';

interface ModeTabProps {
  mode:     AppMode;
  label:    string;
  isActive: boolean;
  onClick:  (mode: AppMode) => void;
}

export function ModeTab({ mode, label, isActive, onClick }: ModeTabProps) {
  return (
    <button
      onClick={() => onClick(mode)}
      style={{
        height:        '100%',
        padding:       '0 20px',
        background:    'transparent',
        border:        'none',
        borderRight:   '1px solid var(--color-border)',
        cursor:        'pointer',
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        /* Línea activa de 2px en la parte inferior */
        boxShadow:     isActive ? 'inset 0 -2px 0 var(--color-active)' : 'none',
        transition:    'color 0.15s ease, box-shadow 0.15s ease',
        whiteSpace:    'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
        }
      }}
    >
      {label}
    </button>
  );
}