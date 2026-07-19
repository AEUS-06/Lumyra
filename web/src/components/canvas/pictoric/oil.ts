// Técnica de renderizado inspirada en pintura al óleo.
//
// El óleo digital se caracteriza por capas grueass de pigmento superpuestas
// con pequeños desplazamientos — el equivalente al impasto en pintura real.
// El resultado es una textura visible, táctil, con sensación de materia acumulada.
//
// Responsabilidad única: implementar la primitiva de óleo.
// No sabe nada de física, partículas ni del store.

import { Ctx2D, Pigment, rgba } from './pigments';

// Pincelada de óleo — pigmento espeso con 4 capas superpuestas.
//
// Cada capa se desplaza aleatoriamente dentro de un radio proporcional
// al tamaño del trazo, con variación de tamaño y opacidad.
// Las 4 capas juntas crean la ilusión de pigmento acumulado y textura
// de impasto sin necesidad de WebGL ni shaders.
//
// Usado para las partículas de flujo y las partículas físicas —
// los elementos que deben sentirse más "materiales" en el canvas.
export function oilStroke(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  pigment: Pigment,
  size:    number,
  opacity: number
): void {
  if (size <= 0 || opacity <= 0) return;

  const layers = 4;

  for (let i = 0; i < layers; i++) {
    const dx = (Math.random() - 0.5) * size * 0.5;
    const dy = (Math.random() - 0.5) * size * 0.5;
    const s  = size * (0.5 + Math.random() * 0.5);
    // La opacidad se distribuye entre las capas para que la suma
    // no supere la opacidad original — evita áreas sobrexuestas
    const op = opacity * (0.4 + Math.random() * 0.6) / layers * 2;

    ctx.beginPath();
    ctx.arc(x + dx, y + dy, s, 0, Math.PI * 2);
    ctx.fillStyle = rgba(pigment, op);
    ctx.fill();
  }
}