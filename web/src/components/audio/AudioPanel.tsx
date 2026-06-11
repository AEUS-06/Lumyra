'use client';

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
  // Una sola instancia del engine en este componente
  const engine     = useAudioEngine();
  const controls   = useAudioControls();
  const panelState = useAudioPanelState();
  const currentTime = useLumyraStore((s) => s.audioCurrentTime);

  const handleFile = useCallback(async (file: File) => {
    await engine.loadFile(file);
    panelState.expand();
  }, [engine, panelState]);

  const dropHandlers = useFileDrop(handleFile);

  const progress = controls.duration > 0
    ? currentTime / controls.duration
    : 0;

  return (
    <div style={{
      position:      'absolute',
      top:           40,
      left:          0,
      width:         220,
      bottom:        48,
      background:    'rgba(4,9,15,0.92)',
      borderRight:   '0.5px solid #0d1a26',
      padding:       '12px 14px',
      display:       'flex',
      flexDirection: 'column',
      gap:           8,
      zIndex:        40,
      overflowY:     'auto',
    }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   4,
      }}>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      9,
          color:         '#2a4a6a',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          campo / audio
        </span>
        <button
          onClick={panelState.toggle}
          style={{
            background: 'transparent',
            border:     'none',
            color:      '#2a4a6a',
            cursor:     'pointer',
            fontSize:   10,
            padding:    0,
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {panelState.expanded ? '−' : '+'}
        </button>
      </div>

      {panelState.expanded && (
        <>
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
              fontFamily: 'var(--font-mono, monospace)',
              fontSize:   10,
              color:      '#ff4444',
              margin:     0,
            }}>
              {engine.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}