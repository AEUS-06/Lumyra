// Trama Ben Day de fondo — textura de puntos en momentos de baja energía.
//
// Responsabilidad única: decidir cuándo y con qué intensidad aplicar
// la trama de puntos sobre el lienzo completo.
// La trama desaparece progresivamente cuando el campo se activa,
// dejando paso al flujo de partículas como protagonista visual.

import { Ctx2D, benDayPattern, BLUE } from '../pictoric';

// Pinta la trama Ben Day si la energía es suficientemente baja.
// Por encima de energy = 0.5 no se dibuja nada — el campo activo
// no necesita esta textura de relleno.
export function drawBenDay(
  ctx:    Ctx2D,
  W:      number,
  H:      number,
  energy: number
): void {
  if (energy > 0.5) return;

  const opacity = (0.5 - energy) * 0.025;
  if (opacity < 0.004) return;

  benDayPattern(ctx, 0, 0, W, H, BLUE, opacity, 10, 1.0);
}
