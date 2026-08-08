'use client';

// Header del popover: símbolo grande + nombre completo del parámetro.
// Responsabilidad única: este bloque visual.

interface PopoverHeaderProps {
  symbol:      string;
  fullName:    string;
  accentColor: string;
}

export function PopoverHeader({ symbol, fullName, accentColor }: PopoverHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: accentColor }}>
        {symbol}
      </span>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      9,
        color:         'var(--color-text-secondary)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {fullName}
      </span>
    </div>
  );
}
