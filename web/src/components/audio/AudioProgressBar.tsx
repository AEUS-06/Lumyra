'use client';

// Barra de progreso de reproducción.
// Responsabilidad única: progreso + tiempo.

interface AudioProgressBarProps {
  currentTime: string;
  duration:    string;
  progress:    number;
}

export function AudioProgressBar({ currentTime, duration, progress }: AudioProgressBarProps) {
  return (
    <div style={{ marginTop: 4 }}>
      {/* Track */}
      <div style={{
        height:       2,
        background:   'var(--color-border)',
        overflow:     'hidden',
        position:     'relative',
      }}>
        {/* Fill */}
        <div style={{
          position:   'absolute',
          inset:      0,
          width:      `${Math.min(progress * 100, 100)}%`,
          background: `linear-gradient(90deg, var(--color-active) 0%, var(--color-hot) 100%)`,
          transition: 'width 0.5s linear',
        }} />
      </div>

      {/* Tiempos */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        marginTop:      6,
      }}>
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      9,
          color:         'var(--color-text-secondary)',
          letterSpacing: '0.06em',
        }}>
          {currentTime}
        </span>
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      9,
          color:         'var(--color-text-muted)',
          letterSpacing: '0.06em',
        }}>
          {duration}
        </span>
      </div>
    </div>
  );
}