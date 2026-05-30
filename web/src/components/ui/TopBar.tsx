'use client';

// Barra superior de Lumyra.
//
// Responsabilidad única: renderizar la topbar y componer los ModeTabs.
// Lee el modo activo del store y dispara setMode al cambiar de tab.
// No contiene lógica de negocio — solo orquesta componentes visuales.

import { useLumyraStore } from '@/store';
import { AppMode } from '@/store/types/app.types';
import { ModeTab } from './ModeTab';

// Definición de los tabs disponibles.
// Si en el futuro se agregan modos, solo se agrega una entrada aquí.
const TABS: { mode: AppMode; label: string }[] = [
  { mode: 'audio', label: '// campo · audio' },
  { mode: 'hands', label: '// campo · manos' },
];

export function TopBar() {
  const mode    = useLumyraStore((s) => s.mode);
  const setMode = useLumyraStore((s) => s.setMode);

  return (
    <header style={{
      position:       'absolute',
      top:            0,
      left:           0,
      right:          0,
      height:         40,
      background:     'rgba(4,9,15,0.95)',
      borderBottom:   '0.5px solid #0d1a26',
      display:        'flex',
      alignItems:     'stretch',
      zIndex:         50,
    }}>
      {/* Wordmark */}
      <div style={{
        padding:       '0 18px',
        display:       'flex',
        alignItems:    'center',
        borderRight:   '0.5px solid #0d1a26',
        flexShrink:    0,
      }}>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      10,
          fontWeight:    700,
          color:         '#fff',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
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

      {/* Indicadores del sistema — esquina derecha */}
      <div style={{
        marginLeft:  'auto',
        display:     'flex',
        alignItems:  'stretch',
      }}>
        <div style={{
          padding:       '0 12px',
          display:       'flex',
          alignItems:    'center',
          borderLeft:    '0.5px solid #0d1a26',
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      8,
          color:         '#1a3a5a',
          letterSpacing: '0.08em',
        }}>
          60fps
        </div>
        <div style={{
          padding:       '0 12px',
          display:       'flex',
          alignItems:    'center',
          borderLeft:    '0.5px solid #0d1a26',
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      8,
          color:         '#1a3a5a',
          letterSpacing: '0.08em',
        }}>
          FFT·2048
        </div>
        {/* Indicador de actividad — verde cuando hay audio o manos activas */}
        <div style={{
          padding:    '0 14px',
          display:    'flex',
          alignItems: 'center',
          borderLeft: '0.5px solid #0d1a26',
        }}>
          <ActivityDot />
        </div>
      </div>
    </header>
  );
}

// Punto de actividad — se ilumina cuando el sistema está procesando datos
function ActivityDot() {
  const audioPlaying  = useLumyraStore((s) => s.audioPlaying);
  const cameraActive  = useLumyraStore((s) => s.cameraActive);
  const isActive      = audioPlaying || cameraActive;

  return (
    <div style={{
      width:      5,
      height:     5,
      borderRadius: '50%',
      background:   isActive ? '#00f0c0' : '#0d1a26',
      boxShadow:    isActive ? '0 0 6px #00f0c0' : 'none',
      transition:   'all 0.3s ease',
    }} />
  );
}