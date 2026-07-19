// Renderizado de las líneas de campo electromagnético.
//
// Responsabilidad única: trazar e integrar las líneas de campo
// y pintarlas como pinceladas de acuarela.
//
// A diferencia de particles/, aquí la integración numérica (matemática)
// y el pintado (visual) están en la misma función porque son inseparables
// en la práctica: cada paso de integración se pinta inmediatamente como
// segmento, no se guarda un array de puntos para dibujar después.
// Esto es una decisión de rendimiento — evita crear arrays intermedios
// en el frame más costoso del pipeline.

import { electricField, vec2 } from '@/lib';
import { Ctx2D, fieldPigment, brushLine } from '../pictoric';
import { FieldSource } from '@/store/types/field.types';

// Configuración de la integración de líneas — valores fijos ajustados
// para balance entre calidad visual y costo computacional.
const LINES_PER_SOURCE = 16;
const MAX_STEPS        = 160;
const STEP_SIZE        = 0.0042;
const SEED_RADIUS      = 0.021;

// Traza y pinta todas las líneas de campo desde las fuentes positivas.
// Cada línea se integra con el método de Euler siguiendo la dirección
// del campo eléctrico normalizado, y cada segmento se pinta con
// brushLine para dar textura de pincelada en lugar de vector puro.
export function drawFieldLines(
  ctx:     Ctx2D,
  W:       number,
  H:       number,
  sources: FieldSource[],
  beat:    number
): void {
  const positiveSources = sources.filter((s) => s.charge > 0);
  if (positiveSources.length === 0) return;

  const negativeSource = sources.find((s) => s.charge < 0);

  for (const src of positiveSources) {
    for (let i = 0; i < LINES_PER_SOURCE; i++) {
      const angle = (i / LINES_PER_SOURCE) * Math.PI * 2;
      let x = src.position.x + Math.cos(angle) * SEED_RADIUS;
      let y = src.position.y + Math.sin(angle) * SEED_RADIUS;
      let prevPx = x * W;
      let prevPy = y * H;

      for (let step = 0; step < MAX_STEPS; step++) {
        const E   = electricField(vec2(x, y), sources);
        const mag = Math.sqrt(E.x * E.x + E.y * E.y);
        if (mag < 1e-7) break;

        x += (E.x / mag) * STEP_SIZE;
        y += (E.y / mag) * STEP_SIZE;

        if (x < -0.08 || x > 1.08 || y < -0.08 || y > 1.08) break;

        if (negativeSource) {
          const dx = x - negativeSource.position.x;
          const dy = y - negativeSource.position.y;
          if (dx * dx + dy * dy < SEED_RADIUS * SEED_RADIUS * 1.6) break;
        }

        const intensity = src.intensity * Math.exp((-step / MAX_STEPS) * 2.2);
        const pigment    = fieldPigment(intensity, beat * 0.4);
        const curPx      = x * W;
        const curPy      = y * H;

        brushLine(
          ctx, prevPx, prevPy, curPx, curPy, pigment,
          0.45 + intensity * 0.35,
          0.3 + intensity * 0.25
        );

        prevPx = curPx;
        prevPy = curPy;
      }
    }
  }
}