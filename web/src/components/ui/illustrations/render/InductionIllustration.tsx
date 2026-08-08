// ∂B/∂t — un punto orbitando en círculo real. Su geometría no varía
// con el dato (no hay un equivalente natural de "más ciclos" para una
// órbita) — la reactividad viene de la escala general aplicada por
// el orquestador ParameterIllustration.tsx.
// Responsabilidad única: esta forma visual únicamente.

interface InductionIllustrationProps {
  color: string;
}

export function InductionIllustration({ color }: InductionIllustrationProps) {
  return (
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'orbit-spin 1.8s linear infinite' }}>
      <circle cx="100" cy="28" r="18" fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="3 5" />
      <circle cx="118" cy="28" r="3.5" fill={color} />
    </g>
  );
}
