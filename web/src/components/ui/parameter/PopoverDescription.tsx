'use client';

// Párrafo explicativo del efecto físico del parámetro.
// Responsabilidad única: este bloque visual.

interface PopoverDescriptionProps {
  description: string;
}

export function PopoverDescription({ description }: PopoverDescriptionProps) {
  return (
    <p style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize:   11,
      lineHeight: 1.55,
      color:      'var(--color-text-secondary)',
      margin:     '0 0 10px',
    }}>
      {description}
    </p>
  );
}
