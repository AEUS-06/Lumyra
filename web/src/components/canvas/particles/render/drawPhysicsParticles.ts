// Renderizado de las partículas físicas del campo (lib/field/particles.ts).
//
// Responsabilidad única: (contexto, partículas físicas) → píxeles.
// No calcula física — Particle ya viene con posición, velocidad, trail
// y carga calculados por useFieldAnimation. Solo se pinta.
//
// La técnica combina puntillismo (trail) con óleo (punto principal),
// dando la sensación de pigmento arrastrado que se deposita.

import { Ctx2D, BLUE, PURPLE, brushStroke, oilStroke } from '../../pictoric';
import { Particle } from '@/lib';

// Dibuja todas las partículas físicas con su trail punteado.
//
// El trail se dibuja solo en puntos alternos (i % 2 === 0) para lograr
// el efecto de puntillismo en lugar de una línea continua — coherente
// con la referencia de cómic/Ben Day del proyecto.
export function drawPhysicsParticles(
  ctx:       Ctx2D,
  W:         number,
  H:         number,
  particles: Particle[],
  beat:      number
): void {
  for (const p of particles) {
    const lifeRatio = p.lifetime / p.maxLifetime;
    const alpha = Math.min(lifeRatio * 5, 1) * (1 - lifeRatio * lifeRatio) * 0.7;
    if (alpha < 0.006) continue;

    const pigment = p.charge > 0 ? BLUE : PURPLE;

    // Trail punteado — puntillismo
    for (let i = 0; i < p.trail.length; i += 2) {
      const point = p.trail[i];
      const trailAlpha = alpha * (1 - i / p.trail.length) * 0.4;
      const trailSize  = 1.2 + (1 - i / p.trail.length) * 1.6;
      brushStroke(ctx, point.x * W, point.y * H, pigment, trailSize, trailAlpha);
    }

    // Punto principal con pigmento espeso
    const size = (2 + alpha * 2.5) * (1 + beat * 0.35);
    oilStroke(ctx, p.position.x * W, p.position.y * H, pigment, size, alpha);
  }
}