// |E| — el número de rayos activos crece con la magnitud del campo.
// Responsabilidad única: esta forma visual únicamente.

import { mapRange } from '../geometry';

interface FieldIllustrationProps {
  color:    string;
  rawValue: number;
}

const ALL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function FieldIllustration({ color, rawValue }: FieldIllustrationProps) {
  const activeCount = Math.max(2, mapRange(rawValue, 2, 8));
  const angles = ALL_ANGLES.slice(0, activeCount);

  return (
    <>
      <circle cx="100" cy="28" r="4" fill={color} />
      {angles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = 100 + Math.cos(rad) * 22;
        const y2 = 28 + Math.sin(rad) * 22;
        return (
          <line
            key={deg}
            x1="100" y1="28" x2={x2} y2={y2}
            stroke={color} strokeWidth={2.5} strokeLinecap="round"
            style={{
              transformBox:    'fill-box',
              transformOrigin: '100px 28px',
              animation:       `ray-pulse 1.3s ease-in-out ${i * 0.06}s infinite`,
            }}
          />
        );
      })}
    </>
  );
}
