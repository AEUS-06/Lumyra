'use client';

// Componente visual del botón de reproducción.
//
// Responsabilidad única: renderizar el botón play/stop y su estado visual.
// No gestiona lógica de reproducción — recibe handlers como props.

interface AudioPlayButtonProps {
  playing:    boolean;
  disabled:   boolean;
  onPlay:     () => void;
  onStop:     () => void;
}

export function AudioPlayButton({
  playing,
  disabled,
  onPlay,
  onStop,
}: AudioPlayButtonProps) {
  return (
    <button
      onClick={playing ? onStop : onPlay}
      disabled={disabled}
      style={{
        width:         '100%',
        padding:       '8px 0',
        background:    'transparent',
        border:        `0.5px solid ${disabled ? '#0d1a26' : playing ? '#00f0c0' : '#3a8fff'}`,
        borderRadius:  3,
        cursor:        disabled ? 'not-allowed' : 'pointer',
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      11,
        letterSpacing: '0.08em',
        color:         disabled ? '#1a2a3a' : playing ? '#00f0c0' : '#3a8fff',
        textTransform: 'uppercase',
        transition:    'all 0.15s ease',
        marginTop:     8,
      }}
    >
      {playing ? '■ detener' : '▶ reproducir'}
    </button>
  );
}