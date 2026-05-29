'use client';

// Componente visual de la etiqueta de un gesto detectado.
//
// Responsabilidad única: renderizar el nombre, descripción y color
// de un gesto para una mano específica.
// No accede al store — recibe los datos ya formateados como props.

import { GestureDisplay } from './hooks/useGestureDisplay';

interface GestureTagProps {
  // 'izquierda' o 'derecha' — identifica qué mano muestra este tag
  hand:     'izquierda' | 'derecha';
  display:  GestureDisplay;
  detected: boolean;
}

export function GestureTag({ hand, display, detected }: GestureTagProps) {
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           2,
      opacity:       detected ? 1 : 0.3,
      transition:    'opacity 0.2s ease',
    }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
      }}>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      9,
          color:         '#2a4a6a',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {hand}
        </span>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      10,
          color:         detected ? display.color : '#1a2a3a',
          letterSpacing: '0.04em',
          fontWeight:    detected ? 600 : 400,
          transition:    'color 0.15s ease',
        }}>
          {display.label}
        </span>
      </div>

      <p style={{
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      9,
        color:         '#1a3a5a',
        margin:        0,
        letterSpacing: '0.03em',
        lineHeight:    1.4,
      }}>
        {display.description}
      </p>
    </div>
  );
}