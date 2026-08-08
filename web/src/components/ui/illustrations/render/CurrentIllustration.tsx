// J — la cantidad de flechas en vuelo simultáneo refleja la densidad
// de corriente. El ciclo de tiempo es fijo (2s); solo la cantidad de
// flechas cambia con el dato, nunca la velocidad de cada una.
// Responsabilidad única: esta forma visual únicamente.

import { mapRange } from '../geometry';

interface CurrentIllustrationProps {
  color:    string;
  rawValue: number;
}

const CYCLE_DURATION_S = 2;

export function CurrentIllustration({ color, rawValue }: CurrentIllustrationProps) {
  const count = mapRange(rawValue, 2, 8);

  return (
    <>
      <line x1="20" y1="28" x2="180" y2="28" stroke={color} strokeOpacity={0.2} strokeWidth={1} />
      {Array.from({ length: count }, (_, i) => {
        const delay = (i / count) * CYCLE_DURATION_S;
        return (
          <path
            key={i}
            d="M-6,-5 L6,0 L-6,5 Z"
            fill={color}
            style={{
              offsetPath: 'path("M20,28 L180,28")',
              animation:  `arrow-travel ${CYCLE_DURATION_S}s linear ${delay}s infinite`,
            } as React.CSSProperties}
          />
        );
      })}
    </>
  );
}
