'use client';

// Wordmark "Lumyra" con marcas de esquina tipo corchete.
// Responsabilidad única: este bloque visual únicamente.

import { BracketCorner } from './BracketCorner';

export function Wordmark() {
  return (
    <div style={{
      position:    'relative',
      padding:     '0 clamp(16px, 4vw, 26px)',
      display:     'flex',
      alignItems:  'center',
      borderRight: '1px solid var(--color-border)',
      flexShrink:  0,
    }}>
      <BracketCorner position="top-left" delay={0} />
      <span style={{
        fontFamily:    "'Bebas Neue', sans-serif",
        fontSize:      'clamp(17px, 3.6vw, 24px)',
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color:         'var(--color-text-primary)',
        lineHeight:    1,
        userSelect:    'none',
        textShadow:    '0 0 24px rgba(255,255,255,0.12)',
      }}>
        Lumyra
      </span>
      <BracketCorner position="bottom-right" delay={0.6} />
    </div>
  );
}
