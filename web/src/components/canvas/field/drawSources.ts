// Renderizado de las fuentes puntuales del campo (+q y -q).
//
// Responsabilidad única: pintar cada fuente con su lenguaje visual completo:
// anillos de acuarela expansivos (ondas), contorno de tinta (cómic),
// y núcleo de óleo con centro blanco titanio.

import { Ctx2D, washFill, inkOutline, oilStroke, rgba, BLUE, PURPLE, WHITE } from '../pictoric';
import { FieldSource } from '@/store/types/field.types';

const RINGS_PER_SOURCE = 4;

// Dibuja todas las fuentes de campo activas.
// time se usa para animar los anillos expansivos de forma continua,
// independiente del framerate real.
export function drawSources(
  ctx:     Ctx2D,
  W:       number,
  H:       number,
  sources: FieldSource[],
  beat:    number,
  time:    number
): void {
  for (const s of sources) {
    const x = s.position.x * W;
    const y = s.position.y * H;
    const pigment = s.charge > 0 ? BLUE : PURPLE;

    // Anillos de acuarela expansivos — como ondas en agua
    for (let i = 0; i < RINGS_PER_SOURCE; i++) {
      const phase  = (time * 0.55 + i * 0.32) % 1;
      const radius = (16 + i * 20) * (1 + beat * 0.45) * phase;
      washFill(ctx, x, y, pigment, radius, (1 - phase) * 0.1 * s.intensity);
    }

    // Aguada base de la fuente
    washFill(ctx, x, y, pigment, 28 + beat * 18, 0.13 * s.intensity);

    // Contorno de tinta — estilo cómic
    inkOutline(ctx, x, y, 6 + beat * 4, 1.5);

    // Núcleo de pigmento espeso
    oilStroke(ctx, x, y, pigment, 5 + beat * 3.5, 0.9);

    // Centro blanco titanio
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = rgba(WHITE, 0.85);
    ctx.fill();
  }
}