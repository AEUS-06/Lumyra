'use client';

// Strip inferior de Lumyra.
//
// Responsabilidad única: leer fieldParams del store, formatearlos
// con useParameterFormat y componer los ParameterValue.
// No contiene lógica de formateo ni de negocio propia.

import { useLumyraStore } from '@/store';
import { useParameterFormat } from './hooks/useParameterFormat';
import { ParameterValue } from './ParameterValue';

export function ParameterStrip() {
  const fieldParams = useLumyraStore((s) => s.fieldParams);
  const mode        = useLumyraStore((s) => s.mode);
  const parameters  = useParameterFormat(fieldParams);

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