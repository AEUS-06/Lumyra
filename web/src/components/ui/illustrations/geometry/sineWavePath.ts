// Genera un path SVG de onda senoidal con un número exacto de ciclos
// completos distribuidos uniformemente en un ancho dado.
//
// Responsabilidad única: esta única función. La usan WavelengthIllustration
// y PermeabilityIllustration — comparten la misma primitiva geométrica,
// solo con distinto número de ciclos derivado del valor del parámetro.

export function sineWavePath(
  periods:   number,
  width:     number,
  amplitude: number,
  baseY:     number
): string {
  const halfStep = width / (periods * 2);
  let d = `M0,${baseY}`;

  for (let i = 0; i < periods * 2; i++) {
    const cx = halfStep * i + halfStep / 2;
    const cy = baseY + (i % 2 === 0 ? -amplitude : amplitude);
    const ex = halfStep * (i + 1);
    d += ` Q${cx},${cy} ${ex},${baseY}`;
  }

  return d;
}
