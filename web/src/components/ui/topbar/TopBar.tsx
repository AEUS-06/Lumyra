'use client';

// Barra superior de Lumyra.
//
// Responsabilidad única: componer Wordmark, ModeTab, SysIndicator y
// ActivityDot. Indicadores técnicos ocultos en mobile — no esenciales
// para la experiencia, sí para el desarrollador.

import { useLumyraStore } from '@/store';
import { AppMode } from '@/store/types/app.types';
import { useMediaQuery, BREAKPOINTS } from '../hooks';
import { Wordmark } from './Wordmark';
import { ModeTab } from './ModeTab';
import { SysIndicator } from './SysIndicator';
import { ActivityDot } from './ActivityDot';

const TABS: { mode: AppMode; label: string }[] = [
  { mode: 'audio', label: '// campo · audio' },
];

export function TopBar() {
  const mode     = useLumyraStore((s) => s.mode);
  const setMode  = useLumyraStore((s) => s.setMode);
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);

  return (
    <header style={{
      position:             'absolute',
      top:                  0,
      left:                 0,
      right:                0,
      height:               'var(--topbar-height)',
      background:           'var(--color-bg-panel)',
      backdropFilter:       'var(--backdrop-blur)',
      WebkitBackdropFilter: 'var(--backdrop-blur)',
      borderBottom:         '1px solid var(--color-border)',
      display:              'flex',
      alignItems:           'stretch',
      zIndex:               50,
      overflow:             'hidden',
    }}>
      {/* Barrido de luz — sensación de instrumento encendido */}
      <div style={{
        position:      'absolute',
        bottom:        -1,
        left:          0,
        width:         '40%',
        height:        1,
        background:    'linear-gradient(90deg, transparent, var(--color-active), transparent)',
        animation:     'scan-line 5s linear infinite',
        pointerEvents: 'none',
      }} />

      <Wordmark />

      <nav style={{ display: 'flex', alignItems: 'stretch', minWidth: 0, overflow: 'hidden' }}>
        {TABS.map((tab) => (
          <ModeTab
            key={tab.mode}
            mode={tab.mode}
            label={tab.label}
            isActive={mode === tab.mode}
            onClick={setMode}
          />
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'stretch' }}>
        {!isMobile && (
          <>
            <SysIndicator label="60fps" />
            <SysIndicator label="FFT·2048" />
          </>
        )}
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--color-border)' }}>
          <ActivityDot />
        </div>
      </div>
    </header>
  );
}
