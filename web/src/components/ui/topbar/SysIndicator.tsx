'use client';

// Indicador técnico de sistema (60fps, FFT·2048), esquina derecha de la topbar.
// Responsabilidad única: este bloque visual únicamente.

interface SysIndicatorProps {
  label: string;
}

export function SysIndicator({ label }: SysIndicatorProps) {
  return (
    <div style={{
      padding:       '0 14px',
      display:       'flex',
      alignItems:    'center',
      borderLeft:    '1px solid var(--color-border)',
      fontFamily:    'var(--font-mono)',
      fontSize:      8,
      letterSpacing: '0.1em',
      color:         'var(--color-text-muted)',
      userSelect:    'none',
      whiteSpace:    'nowrap',
    }}>
      {label}
    </div>
  );
}
