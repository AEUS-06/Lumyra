'use client';

// Strip inferior de Lumyra.
//
// Responsabilidad única: leer fieldParams del store, formatearlos
// con useParameterFormat y componer los ParameterValue.
// No contiene lógica de formateo ni de negocio propia.

import { useCallback } from 'react';
import { useRouter }          from 'next/navigation';
import { useLumyraStore } from '@/store';
import { useParameterFormat } from './hooks/useParameterFormat';
import { ParameterValue } from './ParameterValue';

export function ParameterStrip() {
  const fieldParams = useLumyraStore((s) => s.fieldParams);
  const mode        = useLumyraStore((s) => s.mode);
  const parameters  = useParameterFormat(fieldParams);
  const router      = useRouter();

  const handleHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Etiqueta del modo activo para el lado izquierdo del strip
  const modeLabel = mode === 'audio' ? 'audio · activo' : 'manos · activo';

  return (
    <footer style={{
      position:    'absolute',
      bottom:      0,
      left:        0,
      right:       0,
      height:      48,
      background:  'rgba(4,9,15,0.95)',
      borderTop:   '0.5px solid #0d1a26',
      display:     'flex',
      alignItems:  'stretch',
      zIndex:      50,
    }}>
      {/* Etiqueta del modo activo */}
      <div style={{
        padding:     '0 16px',
        display:     'flex',
        alignItems:  'center',
        borderRight: '0.5px solid #0d1a26',
        flexShrink:  0,
      }}>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      7,
          fontWeight:    700,
          color:         '#1a3a5a',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
        }}>
          {modeLabel}
        </span>
      </div>

        <button
        onClick={handleHome}
        title="Ir al inicio"
        style={{
          padding:        '0 14px',
          background:     'transparent',
          border:         'none',
          borderRight:    '1px solid var(--color-border)',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          gap:            6,
          flexShrink:     0,
          color:          'var(--color-text-muted)',
          transition:     'color 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1L1 5.5V11H4.5V7.5H7.5V11H11V5.5L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
        </svg>
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      7,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
        }}>
          home
        </span>
      </button>

      {/* Valores de los parámetros electromagnéticos */}
      <div style={{
        flex:    1,
        display: 'flex',
      }}>
        {parameters.map((param) => (
          <ParameterValue
            key={param.symbol}
            parameter={param}
          />
        ))}
      </div>

    </footer>
  );
}