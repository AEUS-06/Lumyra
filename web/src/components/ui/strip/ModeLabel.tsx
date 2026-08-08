'use client';

// Etiqueta del modo activo, esquina izquierda del strip.
// Responsabilidad única: este bloque visual. Se oculta por completo
// en pantallas muy angostas (el padre decide cuándo montarla).

interface ModeLabelProps {
  mode: string;
}

export function ModeLabel({ mode }: ModeLabelProps) {
  const label = mode === 'audio' ? 'audio · activo' : 'manos · activo';

  return (
    <div style={{
      padding:     '0 16px',
      display:     'flex',
      alignItems:  'center',
      borderRight: '1px solid var(--color-border)',
      flexShrink:  0,
    }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      7,
        fontWeight:    700,
        color:         'var(--color-text-muted)',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        whiteSpace:    'nowrap',
      }}>
        {label}
      </span>
    </div>
  );
}
