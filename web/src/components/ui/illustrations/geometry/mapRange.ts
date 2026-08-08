// Interpola un valor normalizado [0,1] a un rango entero, con recorte.
//
// Responsabilidad única: esta única función. Reemplaza los cálculos
// `Math.round(min + value * (max - min))` repetidos en cada ilustración
// reactiva (cantidad de puntos, flechas, rayos, ciclos de onda).

export function mapRange(
  value:   number,
  min:     number,
  max:     number,
  inverse: boolean = false
): number {
  const clamped = Math.max(0, Math.min(1, value));
  const t = inverse ? 1 - clamped : clamped;
  return Math.round(min + t * (max - min));
}
