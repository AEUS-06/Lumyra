'use client';

// Botón de play/stop.
// Responsabilidad única: estado visual del control de reproducción.

interface AudioPlayButtonProps {
  playing:  boolean;
  disabled: boolean;
  onPlay:   () => void;
  onStop:   () => void;
}

export function AudioPlayButton({ playing, disabled, onPlay, onStop }: AudioPlayButtonProps) {
  const borderColor = disabled
    ? 'var(--color-border)'
    : playing
    ? 'var(--color-hot)'
    : 'var(--color-active)';

  const textColor = disabled
    ? 'var(--color-text-dim)'
    : playing
    ? 'var(--color-hot)'
    : 'var(--color-active)';

  return (
    <button
      onClick={playing ? onStop : onPlay}
      disabled={disabled}
      style={{
        width:         '100%',
        padding:       '10px 0',
        background:    'transparent',
        border:        `1px solid ${borderColor}`,
        /* Sin border-radius */
        borderRadius:  0,
        cursor:        disabled ? 'not-allowed' : 'pointer',
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      10,
        letterSpacing: '0.1em',
        color:         textColor,
        textTransform: 'uppercase',
        transition:    'border-color 0.15s ease, color 0.15s ease, background 0.15s ease',
        marginTop:     4,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = playing ? 'rgba(0,240,192,0.08)' : 'rgba(58,143,255,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }
      }}
    >
      {playing ? '■ detener' : '▶ reproducir'}
    </button>
  );
}