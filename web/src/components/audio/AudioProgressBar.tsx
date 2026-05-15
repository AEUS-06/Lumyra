'use client';

// Componente visual de la barra de progreso de reproducción.
//
// Responsabilidad única: renderizar el progreso y el tiempo actual.
// No accede al store — recibe los valores formateados como props.

interface AudioProgressBarProps {
  currentTime: string;
  duration:    string;
  // Progreso entre 0 y 1
  progress:    number;
}

export function AudioProgressBar({
  currentTime,
  duration,
  progress,
}: AudioProgressBarProps) {
  return (
    <div style={{ marginTop: 8 }}>
      {/* Barra de progreso */}
      <div style={{
        height:       1,
        background:   '#0d1a26',
        borderRadius: 1,
        overflow:     'hidden',
      }}>
        <div style={{
          height:     '100%',
          width:      `${Math.min(progress * 100, 100)}%`,
          background: '#3a8fff',
          transition: 'width 0.5s linear',
        }} />
      </div>

      {/* Tiempo actual y duración total */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        marginTop:      4,
      }}>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      9,
          color:         '#2a4a6a',
          letterSpacing: '0.06em',
        }}>
          {currentTime}
        </span>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      9,
          color:         '#1a2a3a',
          letterSpacing: '0.06em',
        }}>
          {duration}
        </span>
      </div>
    </div>
  );
}