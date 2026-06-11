'use client';

// Panel de audio como drawer lateral deslizable.
// El FAB (botón flotante) en la esquina inferior izquierda lo abre/cierra.
// Desliza desde la izquierda con cubic-bezier. Backdrop semitransparente.

import { useCallback } from 'react';
import { useAudioEngine }     from '@/hooks';
import { useFileDrop }        from './hooks/useFileDrop';
import { useAudioControls }   from './hooks/useAudioControls';
import { useAudioPanelState } from './hooks/useAudioPanelState';
import { AudioDropZone }      from './AudioDropZone';
import { AudioFileInfo }      from './AudioFileInfo';
import { AudioPlayButton }    from './AudioPlayButton';
import { AudioProgressBar }   from './AudioProgressBar';
import { useLumyraStore }     from '@/store';

export function AudioPanel() {
  const engine      = useAudioEngine();
  const controls    = useAudioControls();
  const panelState  = useAudioPanelState();
  const currentTime = useLumyraStore((s) => s.audioCurrentTime);

  const handleFile = useCallback(async (file: File) => {
    await engine.loadFile(file);
    panelState.expand();
  }, [engine, panelState]);

  const dropHandlers = useFileDrop(handleFile);

  const progress = controls.duration > 0
    ? currentTime / controls.duration
    : 0;

  const isOpen = panelState.expanded;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={panelState.toggle}
          style={{
            position:            'absolute',
            inset:               0,
            zIndex:              38,
            background:          'var(--color-bg-overlay)',
            backdropFilter:      'blur(2px)',
            WebkitBackdropFilter:'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <aside style={{
        position:             'absolute',
        top:                  'var(--topbar-height)',
        left:                 0,
        width:                'clamp(260px, 80vw, var(--drawer-width))',
        bottom:               'var(--strip-height)',
        background:           'var(--color-bg-panel)',
        backdropFilter:       'var(--backdrop-blur)',
        WebkitBackdropFilter: 'var(--backdrop-blur)',
        borderRight:          '1px solid var(--color-border)',
        boxShadow:            'var(--shadow-panel)',
        zIndex:               39,
        display:              'flex',
        flexDirection:        'column',
        gap:                  0,
        overflowY:            'auto',
        transform:            isOpen ? 'translateX(0)' : 'translateX(-105%)',
        transition:           'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange:           'transform',
      }}>
        {/* Header del drawer */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '14px 16px 12px',
          borderBottom:   '1px solid var(--color-border)',
          flexShrink:     0,
        }}>
          <span style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'var(--color-text-muted)',
          }}>
            campo / audio
          </span>
          <button
            onClick={panelState.toggle}
            style={{
              background:  'transparent',
              border:      'none',
              color:       'var(--color-text-muted)',
              cursor:      'pointer',
              fontFamily:  "'JetBrains Mono', monospace",
              fontSize:    14,
              lineHeight:  1,
              padding:     '2px 4px',
              transition:  'color 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div style={{
          padding:       '14px 16px',
          display:       'flex',
          flexDirection: 'column',
          gap:           12,
          flex:          1,
        }}>
          <AudioDropZone
            dropHandlers={dropHandlers}
            hasFile={controls.audioReady}
          />

          {controls.audioReady && (
            <>
              <AudioFileInfo
                fileName={controls.fileName ?? ''}
                duration={controls.durationFormatted}
                decoding={engine.decoding}
              />

              <AudioPlayButton
                playing={controls.playing}
                disabled={engine.decoding}
                onPlay={engine.play}
                onStop={engine.stop}
              />

              {controls.playing && (
                <AudioProgressBar
                  currentTime={controls.currentTimeFormatted}
                  duration={controls.durationFormatted}
                  progress={progress}
                />
              )}
            </>
          )}

          {engine.error && (
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   10,
              color:      'var(--color-danger)',
              margin:     0,
            }}>
              {engine.error}
            </p>
          )}
        </div>
      </aside>

      {/* FAB */}
      <DrawerFAB isOpen={isOpen} onToggle={panelState.toggle} audioReady={controls.audioReady} />
    </>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

interface DrawerFABProps {
  isOpen:     boolean;
  onToggle:   () => void;
  audioReady: boolean;
}

function DrawerFAB({ isOpen, onToggle, audioReady }: DrawerFABProps) {
  return (
    <button
      onClick={onToggle}
      title={isOpen ? 'Cerrar panel de audio' : 'Abrir panel de audio'}
      style={{
        position:       'absolute',
        bottom:         `calc(var(--strip-height) + 16px)`,
        left:           16,
        zIndex:         45,
        width:          'var(--fab-size)',
        height:         'var(--fab-size)',
        borderRadius:   '50%',
        background:     isOpen
          ? 'var(--color-text-primary)'
          : 'var(--color-bg-surface)',
        border:         '1px solid var(--color-border-mid)',
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        boxShadow:      'var(--shadow-panel)',
        outline:        audioReady && !isOpen ? '2px solid var(--color-active)' : 'none',
        outlineOffset:  2,
        transition:     'background 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   14,
        lineHeight: 1,
        color:      isOpen ? 'var(--color-bg)' : 'var(--color-text-secondary)',
        display:    'block',
        transform:  isOpen ? 'rotate(45deg)' : 'none',
        transition: 'transform 0.25s ease, color 0.2s ease',
      }}>
        +
      </span>
    </button>
  );
}