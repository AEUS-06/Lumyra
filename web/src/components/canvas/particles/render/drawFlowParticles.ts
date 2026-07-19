// Renderizado de las partículas de flujo del campo.
//
// Responsabilidad única: (contexto, flow particles) → píxeles.
// No calcula posiciones ni física — solo pinta el estado que recibe.
// La técnica visual es óleo: pigmento espeso con textura de impasto.

import { Ctx2D, fieldPigment, oilStroke } from '../../pictoric';
import { FlowParticle } from '../simulation';

// Dibuja todas las flow particles activas en el frame actual.
//
// La opacidad de cada partícula sigue una curva de fade-in rápido
// y fade-out suave según su edad relativa (age / maxAge), para que
// aparezcan con energía y se desvanezcan orgánicamente.
export function drawFlowParticles(
  ctx:  Ctx2D,
  W:    number,
  H:    number,
  flow: FlowParticle[],
  beat: number
): void {
  for (const p of flow) {
    const lifeRatio = p.age / p.maxAge;
    const alpha = Math.min(lifeRatio * 6, 1) * Math.pow(1 - lifeRatio, 0.5) * 0.65;
    if (alpha < 0.006) continue;

    const pigment = fieldPigment(p.intensity, beat);
    const x = p.x * W;
    const y = p.y * H;
    const size = p.size * (1 + beat * 0.4);

    oilStroke(ctx, x, y, pigment, size, alpha);
  }
}