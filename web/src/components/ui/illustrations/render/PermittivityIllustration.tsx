// ε₀ — ondas expandiéndose desde el centro. La reactividad viene de
// la escala general aplicada por el orquestador ParameterIllustration.tsx.
// Responsabilidad única: esta forma visual únicamente.

interface PermittivityIllustrationProps {
  color: string;
}

const RING_DELAYS = [0, 0.6, 1.2];

export function PermittivityIllustration({ color }: PermittivityIllustrationProps) {
  return (
    <>
      {RING_DELAYS.map((delay, i) => (
        <circle
          key={i}
          cx="100" cy="28" r="4"
          fill="none" stroke={color} strokeWidth={1.5}
          style={{
            transformBox:    'fill-box',
            transformOrigin: 'center',
            animation:       `burst-pulse 1.8s ease-out ${delay}s infinite`,
          }}
        />
      ))}
      <circle cx="100" cy="28" r="3" fill={color} />
    </>
  );
}
