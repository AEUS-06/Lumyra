// Anillo de pulso disparado una vez por cada beat detectado.
//
// Responsabilidad única: esta forma visual únicamente. Se reinicia
// intencionalmente en cada beat vía la prop `beatKey` usada como key
// de React por el componente padre — remount deliberado, no un loop.

interface BeatPulseRingProps {
  color:    string;
  beatKey:  number;
}

export function BeatPulseRing({ color, beatKey }: BeatPulseRingProps) {
  if (beatKey <= 0) return null;

  return (
    <circle
      key={beatKey}
      cx="100" cy="28" r="4"
      fill="none" stroke={color} strokeWidth={2}
      style={{
        transformBox:    'fill-box',
        transformOrigin: 'center',
        animation:       'beat-kick 0.4s ease-out',
      }}
    />
  );
}
