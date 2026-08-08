// λ — el número de crestas es inversamente proporcional al dato:
// λ alta (onda larga) → pocas crestas caben en el ancho fijo.
// λ baja (onda corta) → muchas crestas caben en el mismo ancho.
// Responsabilidad única: esta forma visual únicamente.

import { sineWavePath, mapRange } from '../geometry';

interface WavelengthIllustrationProps {
  color:    string;
  rawValue: number;
}

export function WavelengthIllustration({ color, rawValue }: WavelengthIllustrationProps) {
  const periods  = mapRange(rawValue, 2, 7, true); // inverso: valor alto → menos crestas
  const path     = sineWavePath(periods, 210, 18, 28);
  const dashUnit = Math.max(4, 105 / periods);

  return (
    <path
      d={path}
      fill="none" stroke={color} strokeWidth={2.5}
      strokeDasharray={`${dashUnit * 0.65} ${dashUnit * 0.45}`}
      style={{ animation: 'dash-travel 2.5s linear infinite' }}
    />
  );
}
