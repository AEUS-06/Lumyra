// ω — oscilación vertical real y visible. La reactividad viene de la
// escala general del orquestador, que amplifica el swing con el dato.
// Responsabilidad única: esta forma visual únicamente.

interface FrequencyIllustrationProps {
  color: string;
}

export function FrequencyIllustration({ color }: FrequencyIllustrationProps) {
  return (
    <>
      <line x1="100" y1="8" x2="100" y2="48" stroke={color} strokeOpacity={0.15} strokeWidth={1} />
      <circle
        cx="100" cy="28" r="5"
        fill={color}
        style={{
          transformBox:    'fill-box',
          transformOrigin: 'center',
          animation:       'oscillate-y 1s ease-in-out infinite',
        }}
      />
    </>
  );
}
