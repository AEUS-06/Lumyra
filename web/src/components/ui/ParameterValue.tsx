'use client';

// Componente visual de un parámetro físico individual en el strip inferior.
//
// Responsabilidad única: renderizar el símbolo y valor de un parámetro.
// No accede al store — recibe los datos ya formateados como props
// desde ParameterStrip.

import { FormattedParameter } from './hooks/useParameterFormat';

interface ParameterValueProps {
  parameter: FormattedParameter;
}

export function ParameterValue({ parameter }: ParameterValueProps) {
  const { symbol, value, isActive, isHot } = parameter;

  // Color del valor según su nivel de actividad
  const valueColor = isHot
    ? '#00f0c0'
    : isActive
    ? '#3a8fff'
    : '#1a3a5a';

  return (
    <div style={{
      flex:          1,
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      justifyContent: 'center',
      gap:           2,
      padding:       '0 4px',
      borderRight:   '0.5px solid #0a1520',
      minWidth:      0,
    }}>
      {/* Símbolo físico */}
      <span style={{
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      7,
        color:         '#1a3a5a',
        letterSpacing: '0.05em',
        whiteSpace:    'nowrap',
      }}>
        {symbol}
      </span>

      {/* Valor numérico */}
      <span style={{
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      11,
        color:         valueColor,
        fontWeight:    isHot ? 600 : 400,
        letterSpacing: '0.03em',
        transition:    'color 0.2s ease',
      }}>
        {value}
      </span>
    </div>
  );
}