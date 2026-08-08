// ρ — la cantidad de puntos crece con la densidad de carga real.
// Responsabilidad única: esta forma visual únicamente.

import { mapRange } from '../geometry';

interface DensityIllustrationProps {
  color:    string;
  rawValue: number;
}

export function DensityIllustration({ color, rawValue }: DensityIllustrationProps) {
  const count = mapRange(rawValue, 3, 9);
  const dots = Array.from({ length: count }, (_, i) => 30 + (140 / (count - 1 || 1)) * i);

  return (
    <>
      {dots.map((x, i) => (
        <circle
          key={x}
          cx={x} cy={28} r={4}
          fill={color}
          style={{
            transformBox:    'fill-box',
            transformOrigin: 'center',
            animation:       `dot-multiply 1.2s ease-in-out ${(i % 5) * 0.15}s infinite`,
          }}
        />
      ))}
    </>
  );
}
