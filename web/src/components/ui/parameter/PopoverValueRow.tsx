'use client';

// Fila inferior del popover: etiqueta de estado + valor actual.
// Responsabilidad única: este bloque visual.

interface PopoverValueRowProps {
  audioPlaying: boolean;
  value:        string;
  accentColor:  string;
}

export function PopoverValueRow({ audioPlaying, value, accentColor }: PopoverValueRowProps) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      paddingTop:     8,
      borderTop:      '1px solid var(--color-border)',
    }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      8,
        color:         'var(--color-text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {audioPlaying ? 'reactivo a la música' : 'valor actual'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: accentColor }}>
        {value}
      </span>
    </div>
  );
}
