'use client';

// Barra superior de Lumyra.
// Responsabilidad única: wordmark, tabs de modo, indicadores del sistema.
//
// Wordmark más grande y con más presencia. Marcas de esquina con pulso
// continuo. Barrido de luz sutil bajo el borde inferior para dar
// sensación de instrumento encendido, no de panel estático.

import { useLumyraStore } from '@/store';
import { AppMode } from '@/store/types/app.types';
import { ModeTab } from './ModeTab';
import { useMediaQuery, BREAKPOINTS } from './hooks/useMediaQuery';

const TABS: { mode: AppMode; label: string }[] = [
  { mode: 'audio', label: '// campo · audio' },
];

export function TopBar() {
  const mode      = useLumyraStore((s) => s.mode);
  const setMode   = useLumyraStore((s) => s.setMode);
  const isMobile  = useMediaQuery(BREAKPOINTS.mobile);

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
      {/* Barrido de luz — instrumento "encendido" */}
      <div style={{
        position:  'absolute',
        bottom:    -1,
        left:      0,
        width:     '40%',
        height:    1,
        background: 'linear-gradient(90deg, transparent, var(--color-active), transparent)',
        animation:  'scan-line 5s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Wordmark con esquinas tipo corchete pulsantes */}
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

      {/* Tabs de modo */}
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

      {/* Indicadores del sistema */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'stretch' }}>
        {!isMobile && (
          <>
            <SysIndicator label="60fps" />
            <SysIndicator label="FFT·2048" />
          </>
        )}
        <div style={{
          padding:    '0 16px',
          display:    'flex',
          alignItems: 'center',
          borderLeft: '1px solid var(--color-border)',
        }}>
          <ActivityDot />
        </div>
      </div>
    </header>
  );
}

function BracketCorner({ position, delay }: { position: 'top-left' | 'bottom-right'; delay: number }) {
  const isTopLeft = position === 'top-left';
  return (
    <span style={{
      position:     'absolute',
      top:          isTopLeft ? 4 : undefined,
      bottom:       !isTopLeft ? 4 : undefined,
      left:         isTopLeft ? 2 : undefined,
      right:        !isTopLeft ? 2 : undefined,
      width:        7,
      height:       7,
      borderTop:    isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      borderLeft:   isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      borderBottom: !isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      borderRight:  !isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      animation:    `bracket-pulse 2.4s ease-in-out ${delay}s infinite`,
    }} />
  );
}

function SysIndicator({ label }: { label: string }) {
  return (
    <div style={{
      padding:       '0 14px',
      display:       'flex',
      alignItems:    'center',
      borderLeft:    '1px solid var(--color-border)',
      fontFamily:    'var(--font-mono)',
      fontSize:      8,
      letterSpacing: '0.1em',
      color:         'var(--color-text-muted)',
      userSelect:    'none',
      whiteSpace:    'nowrap',
    }}>
      {label}
    </div>
  );
}

function ActivityDot() {
  const audioPlaying = useLumyraStore((s) => s.audioPlaying);

  return (
    <div style={{
      width:        6,
      height:       6,
      borderRadius: '50%',
      background:   audioPlaying ? 'var(--color-hot)' : 'var(--color-border-mid)',
      boxShadow:    audioPlaying ? '0 0 10px var(--color-hot)' : 'none',
      animation:    audioPlaying ? 'activity-pulse 1.2s ease-in-out infinite' : 'none',
      transition:   'background 0.3s ease, box-shadow 0.3s ease',
      flexShrink:   0,
    }} />
  );
}