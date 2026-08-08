'use client';

// La ecuación de Maxwell correspondiente al parámetro.
// Responsabilidad única: este bloque visual.

interface PopoverFormulaProps {
  formula: string;
}

export function PopoverFormula({ formula }: PopoverFormulaProps) {
  return (
    <div style={{
      fontFamily:    'var(--font-mono)',
      fontSize:      12,
      color:         'var(--color-text-primary)',
      marginBottom:  10,
      letterSpacing: '0.02em',
    }}>
      {formula}
    </div>
  );
}
