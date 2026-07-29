'use client';

// Strip inferior de Lumyra.
//
// Responsabilidad única: componer los ParameterValue y gestionar cuál
// popover está abierto — solo uno a la vez.
//
// fieldParams se lee con throttle (ver useThrottledStoreValue) — el dato
// real cambia 60 veces por segundo pero la UI solo necesita confirmar
// ~15 veces por segundo para verse igual de fluida con mucho menos trabajo
// de render. El scroll horizontal usa scroll-snap para que se sienta
// intencional en mobile, no como un desbordamiento accidental.

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLumyraStore, LumyraStore } from '@/store';
import { useParameterFormat } from './hooks/useParameterFormat';
import { useMediaQuery, BREAKPOINTS } from './hooks/useMediaQuery';
import { useThrottledStoreValue } from './hooks/useThrottledStoreValue';
import { ParameterValue } from './ParameterValue';

// Selector definido fuera del componente — referencia estable,
// necesaria para que useThrottledStoreValue no re-suscriba en cada render.
const selectFieldParams = (s: LumyraStore) => s.fieldParams;

interface OpenPopoverState {
  symbol: string;
  rect:   { left: number; top: number; width: number };
}

export function ParameterStrip() {
  const fieldParams = useThrottledStoreValue(selectFieldParams, 66);
  const mode        = useLumyraStore((s) => s.mode);
  const parameters  = useParameterFormat(fieldParams);
  const router      = useRouter();
  const isNarrow    = useMediaQuery(BREAKPOINTS.narrow);

  const [openPopover, setOpenPopover] = useState<OpenPopoverState | null>(null);

  const handleHome = useCallback(() => router.push('/'), [router]);

  const handleToggle = useCallback((symbol: string, rect: { left: number; top: number; width: number }) => {
    setOpenPopover((prev) => (prev?.symbol === symbol ? null : { symbol, rect }));
  }, []);

  const handleClose = useCallback(() => setOpenPopover(null), []);

  const modeLabel = mode === 'audio' ? 'audio · activo' : 'manos · activo';

  return (
    <footer style={{
      position:             'absolute',
      bottom:               0,
      left:                 0,
      right:                0,
      height:               'var(--strip-height)',
      background:           'var(--color-bg-panel)',
      backdropFilter:       'var(--backdrop-blur)',
      WebkitBackdropFilter: 'var(--backdrop-blur)',
      borderTop:            '1px solid var(--color-border)',
      display:              'flex',
      alignItems:           'stretch',
      zIndex:               50,
    }}>
      {!isNarrow && (
        <div style={{
          padding:     '0 16px',
          display:     'flex',
          alignItems:  'center',
          borderRight: '1px solid var(--color-border)',
          flexShrink:  0,
        }}>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      7,
            fontWeight:    700,
            color:         'var(--color-text-muted)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace:    'nowrap',
          }}>
            {modeLabel}
          </span>
        </div>
      )}

      <button
        onClick={handleHome}
        title="Ir al inicio"
        style={{
          padding:     '0 14px',
          background:  'transparent',
          border:      'none',
          borderRight: '1px solid var(--color-border)',
          cursor:      'pointer',
          display:     'flex',
          alignItems:  'center',
          gap:         6,
          flexShrink:  0,
          color:       'var(--color-text-muted)',
          transition:  'color 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1L1 5.5V11H4.5V7.5H7.5V11H11V5.5L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
        </svg>
        {!isNarrow && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            home
          </span>
        )}
      </button>

      {/* Scroll horizontal con snap — se siente intencional, no accidental */}
      <div style={{
        flex:                    1,
        display:                 'flex',
        overflowX:               'auto',
        overflowY:               'hidden',
        scrollbarWidth:          'none',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior:          'smooth',
        scrollSnapType:          'x proximity',
      }}>
        {parameters.map((param) => (
          <ParameterValue
            key={param.symbol}
            parameter={param}
            isOpen={openPopover?.symbol === param.symbol}
            anchorRect={openPopover?.symbol === param.symbol ? openPopover.rect : null}
            onToggle={handleToggle}
            onClose={handleClose}
          />
        ))}
      </div>
    </footer>
  );
}