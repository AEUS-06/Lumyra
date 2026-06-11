'use client';

// Barra superior de Lumyra.
// 48px, Bebas Neue wordmark, tabs de modo, indicadores del sistema.

import { useLumyraStore } from '@/store';
import { AppMode } from '@/store/types/app.types';
import { ModeTab } from './ModeTab';

const TABS: { mode: AppMode; label: string }[] = [
  { mode: 'audio', label: '// campo · audio' },
];

export function TopBar() {
  const mode    = useLumyraStore((s) => s.mode);
  const setMode = useLumyraStore((s) => s.setMode);

  return (
    <header style={{
      position:     'absolute',
      top:          0,
      left:         0,
      right:        0,
      height:       'var(--topbar-height)',
      background:   'var(--color-bg-panel)',
      backdropFilter: 'var(--backdrop-blur)',
      WebkitBackdropFilter: 'var(--backdrop-blur)',
      borderBottom: '1px solid var(--color-border)',
      display:      'flex',
      alignItems:   'stretch',
      zIndex:       50,
    }}>

      {/* Wordmark — Bebas Neue */}
      <div style={{
        padding:       '0 20px',
        display:       'flex',
        alignItems:    'center',
        borderRight:   '1px solid var(--color-border)',
        flexShrink:    0,
      }}>
        <span style={{
          fontFamily:    "'Bebas Neue', sans-serif",
          fontSize:      20,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color:         'var(--color-text-primary)',
          lineHeight:    1,
          userSelect:    'none',
        }}>
          Lumyra
        </span>
      </div>

      {/* Tabs de modo */}
      <nav style={{ display: 'flex', alignItems: 'stretch' }}>
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

      {/* Indicadores del sistema — derecha */}
      <div style={{
        marginLeft:  'auto',
        display:     'flex',
        alignItems:  'stretch',
      }}>
        <SysIndicator label="60fps" />
        <SysIndicator label="FFT·2048" />

        {/* ActivityDot */}
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

// ─── Indicador de sistema ─────────────────────────────────────────────────────

function SysIndicator({ label }: { label: string }) {
  return (
    <div style={{
      padding:       '0 14px',
      display:       'flex',
      alignItems:    'center',
      borderLeft:    '1px solid var(--color-border)',
      fontFamily:    "'JetBrains Mono', monospace",
      fontSize:      8,
      letterSpacing: '0.1em',
      color:         'var(--color-text-muted)',
      userSelect:    'none',
    }}>
      {label}
    </div>
  );
}

// ─── ActivityDot ──────────────────────────────────────────────────────────────

function ActivityDot() {
  const audioPlaying = useLumyraStore((s) => s.audioPlaying);

  return (
    <div style={{
      width:        6,
      height:       6,
      borderRadius: '50%',
      background:   audioPlaying ? 'var(--color-hot)' : 'var(--color-border-mid)',
      boxShadow:    audioPlaying ? '0 0 8px var(--color-hot)' : 'none',
      animation:    audioPlaying ? 'activity-pulse 1.2s ease-in-out infinite' : 'none',
      transition:   'background 0.3s ease, box-shadow 0.3s ease',
    }} />
  );
}