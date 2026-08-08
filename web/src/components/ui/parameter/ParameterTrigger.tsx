'use client';

// El botón/tarjeta que representa un parámetro en el strip.
//
// Responsabilidad única: renderizar símbolo, valor y LevelBar, y
// exponer su posición en pantalla al hacer click. No sabe nada del
// popover ni de su ciclo de vida — solo dispara onClick con su rect.

import { forwardRef } from 'react';
import { FormattedParameter } from '../hooks';
import { LevelBar } from './LevelBar';

interface ParameterTriggerProps {
  parameter:   FormattedParameter;
  isOpen:      boolean;
  accentColor: string;
  onClick:     () => void;
}

export const ParameterTrigger = forwardRef<HTMLButtonElement, ParameterTriggerProps>(
  function ParameterTrigger({ parameter, isOpen, accentColor, onClick }, ref) {
    const { symbol, value, rawValue, isHot } = parameter;

    return (
      <button
        ref={ref}
        onClick={onClick}
        title={`Ver información de ${symbol}`}
        style={{
          minWidth:      92,
          display:       'flex',
          flexDirection: 'column',
          gap:           6,
          padding:       '7px 12px',
          margin:        '6px 4px',
          background:    'var(--color-bg-surface)',
          border:        `1px solid ${isOpen ? accentColor : isHot ? 'var(--color-hot)' : 'var(--color-border)'}`,
          boxShadow:     isOpen ? 'var(--shadow-glow-active)' : isHot ? 'var(--shadow-glow-hot)' : 'none',
          animation:     'fade-slide-in 0.4s ease both',
          transition:    'border-color 0.3s ease, box-shadow 0.3s ease',
          cursor:        'pointer',
          textAlign:     'left',
          contain:       'layout style paint',
        }}
      >
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      8,
          color:         'var(--color-text-secondary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
        }}>
          {symbol}
        </span>

        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      19,
          fontWeight:    isHot ? 700 : 500,
          color:         isHot ? 'var(--color-hot)' : 'var(--color-text-primary)',
          letterSpacing: '0.01em',
          lineHeight:    1,
          whiteSpace:    'nowrap',
          animation:     isHot ? 'value-glow 1.4s ease-in-out infinite' : 'none',
        }}>
          {value}
        </span>

        <LevelBar level={rawValue} accentColor={accentColor} />
      </button>
    );
  }
);
