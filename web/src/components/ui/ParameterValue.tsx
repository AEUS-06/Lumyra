'use client';

// Parámetro individual — tarjeta tipo viñeta con barra de nivel segmentada.
//
// Responsabilidad única: renderizar la tarjeta y calcular su posición
// para el popover. `contain: 'layout style paint'` aísla el repintado de
// cada tarjeta — un cambio de color o glow en una no fuerza al navegador
// a recalcular layout de las demás, reduciendo el costo de render conjunto.
//
// El popover permanece montado unos milisegundos más al cerrarse para
// poder animar su salida — desaparecer de golpe se siente "cortado";
// desvanecerse se siente intencional.

import { useRef, useEffect, useState } from 'react';
import { FormattedParameter } from './hooks/useParameterFormat';
import { ParameterPopover } from './ParameterPopover';

interface ParameterValueProps {
  parameter:  FormattedParameter;
  isOpen:     boolean;
  onToggle:   (symbol: string, rect: { left: number; top: number; width: number }) => void;
  onClose:    () => void;
  anchorRect: { left: number; top: number; width: number } | null;
}

const SEGMENTS = 8;
const CLOSE_ANIMATION_MS = 180;

export function ParameterValue({ parameter, isOpen, onToggle, onClose, anchorRect }: ParameterValueProps) {
  const { symbol, value, rawValue, isActive, isHot } = parameter;
  const triggerRef = useRef<HTMLButtonElement>(null);

  // El popover sigue montado brevemente tras cerrarse para animar su salida
  const [shouldRenderPopover, setShouldRenderPopover] = useState(isOpen);
  useEffect(() => {
    if (isOpen) {
      setShouldRenderPopover(true);
      return;
    }
    const timeout = setTimeout(() => setShouldRenderPopover(false), CLOSE_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const accentColor = isHot
    ? 'var(--color-hot)'
    : isActive
    ? 'var(--color-active)'
    : 'var(--color-text-dim)';

  const litSegments = Math.round(Math.max(0, Math.min(1, rawValue)) * SEGMENTS);

  function handleClick() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    onToggle(symbol, { left: rect.left, top: rect.top, width: rect.width });
  }

  return (
    <div style={{ position: 'relative', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
      <button
        ref={triggerRef}
        onClick={handleClick}
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

        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const lit = i < litSegments;
            const segColor = lit
              ? (i >= SEGMENTS - 2 ? 'var(--color-hot)' : accentColor)
              : 'var(--color-border)';
            return (
              <div
                key={i}
                style={{
                  flex:       1,
                  height:     5,
                  background: segColor,
                  opacity:    lit ? 1 : 0.5,
                  transition: 'background 0.15s ease, opacity 0.15s ease',
                  willChange: 'background, opacity',
                }}
              />
            );
          })}
        </div>
      </button>

      {shouldRenderPopover && anchorRect && (
        <ParameterPopover
          parameter={parameter}
          anchorRect={anchorRect}
          accentColor={accentColor}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </div>
  );
}