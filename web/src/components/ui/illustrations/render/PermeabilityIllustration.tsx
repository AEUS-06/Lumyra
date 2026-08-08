// μ₀ — el número de ciclos de la onda cambia con el dato real, usando
// stroke-dashoffset (timing fijo) para el desplazamiento, evitando el
// problema de sincronizar manualmente un tile con ancho variable.
// Responsabilidad única: esta forma visual únicamente.

import { sineWavePath, mapRange } from '../geometry';

interface PermeabilityIllustrationProps {
  color:    string;
  rawValue: number;
}

export function PermeabilityIllustration({ color, rawValue }: PermeabilityIllustrationProps) {
  const periods  = mapRange(rawValue, 3, 8);
  const path     = sineWavePath(periods, 200, 14, 28);
  const dashUnit = Math.max(4, 100 / periods);

  return (
    <path
      d={path}
      fill="none" stroke={color} strokeWidth={2}
      strokeDasharray={`${dashUnit * 0.6} ${dashUnit * 0.4}`}
      style={{ animation: 'dash-travel 2s linear infinite' }}
    />
  );
}
