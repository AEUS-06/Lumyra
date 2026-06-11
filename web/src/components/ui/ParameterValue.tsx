'use client';

// Parámetro individual con VU meter vertical.
// Responsabilidad única: símbolo + valor + barra de nivel.

import { FormattedParameter } from './hooks/useParameterFormat';

interface ParameterValueProps {
  parameter:    FormattedParameter;
  hideOnMobile?: boolean;
}

export function ParameterValue({ parameter, hideOnMobile }: ParameterValueProps) {
  const { symbol, value, isActive, isHot } = parameter;

  // Color del valor según nivel de actividad
  const valueColor = isHot
    ? 'var(--color-hot)'
    : isActive
    ? 'var(--color-active)'
    : 'var(--color-text-muted)';

  // Nivel de la barra — extraído del valor numérico si es posible
  const level = isHot ? 0.9 : isActive ? 0.5 : 0.1;

  return (
    <div
      style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '0 10px',
        borderRight:    '1px solid var(--color-border-light)',
        minWidth:       0,
        overflow:       'hidden',
        /* En mobile, ocultar si hideOnMobile = true */
        ...(hideOnMobile ? { display: 'none' } : {}),
      }}
      // Aplicar media query vía ref no es idiomático en React — usamos un style tag global en globals.css
      // o la solución más simple: el componente renderiza siempre, pero el padre puede no incluirlo.
      // Aquí usamos el atributo data para que CSS pueda targetear (en globals.css).
      data-hide-mobile={hideOnMobile ? 'true' : undefined}
    >
      {/* VU meter vertical */}
      <div style={{
        width:          3,
        height:         24,
        background:     'var(--color-border)',
        flexShrink:     0,
        position:       'relative',
        overflow:       'hidden',
      }}>
        <div style={{
          position:      'absolute',
          bottom:        0,
          left:          0,
          right:         0,
          height:        `${level * 100}%`,
          background:    isHot
            ? 'var(--color-hot)'
            : isActive
            ? 'var(--color-active)'
            : 'var(--color-border-mid)',
          transition:    'height 0.2s ease, background 0.2s ease',
          /* Pulso sutil cuando está hot */
          animation:     isHot ? 'activity-pulse 0.8s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* Texto */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        gap:            2,
        minWidth:       0,
        overflow:       'hidden',
      }}>
        {/* Símbolo */}
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      7,
          color:         'var(--color-text-muted)',
          letterSpacing: '0.06em',
          whiteSpace:    'nowrap',
        }}>
          {symbol}
        </span>

        {/* Valor numérico */}
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      11,
          fontWeight:    isHot ? 600 : 400,
          color:         valueColor,
          letterSpacing: '0.02em',
          transition:    'color 0.2s ease',
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}