// Fondo del lienzo — aguada persistente estilo acuarela.
//
// Responsabilidad única: pintar la capa base de cada frame.
// La opacidad muy baja hace que los trazos de frames anteriores
// persistan como manchas diluidas, en lugar de limpiarse por completo —
// el efecto de "papel húmedo" que retiene el pigmento.

import { Ctx2D, rgba, BG } from '../pictoric';

// Pinta el fondo del frame actual.
// La opacidad escala levemente con la energía del campo y el beat,
// haciendo que los momentos intensos "laven" el lienzo un poco más rápido.
export function drawBackground(
  ctx:    Ctx2D,
  W:      number,
  H:      number,
  energy: number,
  beat:   number
): void {
  const opacity = 0.025 + energy * 0.015 + beat * 0.055;
  ctx.fillStyle = rgba(BG, opacity);
  ctx.fillRect(0, 0, W, H);
}
