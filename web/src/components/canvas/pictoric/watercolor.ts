// Técnicas de renderizado inspiradas en acuarela.
//
// La acuarela digital funciona por acumulación de capas translúcidas.
// Cada trazo tiene bordes irregulares y el pigmento se concentra en el centro
// diluyéndose hacia afuera, exactamente como en papel húmedo.
//
// Responsabilidad única: implementar las primitivas de acuarela.
// No sabe nada de física, partículas ni del store.

import { Ctx2D, Pigment, rgba } from './pigments';

// Aguada circular — capa translúcida con bordes orgánicos.
//
// Simula el comportamiento del pigmento en papel húmedo:
// concentrado en el centro, diluyéndose hacia el borde con una curva
// no lineal que imita la tensión superficial del agua.
// Usado para anillos de campo alrededor de las fuentes y fondos de energía.
export function washFill(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  pigment: Pigment,
  radius:  number,
  opacity: number
): void {
  if (radius <= 0 || opacity <= 0) return;

  const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grd.addColorStop(0,    rgba(pigment, opacity));
  grd.addColorStop(0.45, rgba(pigment, opacity * 0.55));
  grd.addColorStop(0.75, rgba(pigment, opacity * 0.15));
  grd.addColorStop(0.90, rgba(pigment, opacity * 0.04));
  grd.addColorStop(1,    rgba(pigment, 0));

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();
}

// Pincelada puntual con jitter — trazo con micro-variación de pincel.
//
// Se dibuja el mismo punto 3 veces con pequeños desplazamientos y
// variaciones de tamaño y opacidad. El resultado imita la irregularidad
// de los pelos de un pincel cargado de pigmento.
// Usado para trails de partículas y detalles de textura.
export function brushStroke(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  pigment: Pigment,
  size:    number,
  opacity: number
): void {
  if (size <= 0 || opacity <= 0) return;

  const jitter = size * 0.18;

  for (let i = 0; i < 3; i++) {
    const dx = (Math.random() - 0.5) * jitter;
    const dy = (Math.random() - 0.5) * jitter;
    const s  = size * (0.65 + Math.random() * 0.35);
    const op = opacity * (0.35 + Math.random() * 0.65);

    ctx.beginPath();
    ctx.arc(x + dx, y + dy, s, 0, Math.PI * 2);
    ctx.fillStyle = rgba(pigment, op);
    ctx.fill();
  }
}

// Segmento de línea como pincelada orgánica.
//
// Dibuja el segmento dos veces:
// 1. Capa de aguada — más ancha, desplazada con jitter, opacidad baja.
//    Simula el agua que precede al pigmento en papel húmedo.
// 2. Capa de pigmento — nítida, encima, opacidad completa.
//    El trazo concentrado que deja el pincel.
//
// Este doble trazo da la ilusión de que las líneas de campo tienen
// profundidad y textura, en lugar de ser vectores matemáticos puros.
export function brushLine(
  ctx:     Ctx2D,
  x0:      number,
  y0:      number,
  x1:      number,
  y1:      number,
  pigment: Pigment,
  width:   number,
  opacity: number
): void {
  if (width <= 0 || opacity <= 0) return;

  const jx = (Math.random() - 0.5) * width * 0.4;
  const jy = (Math.random() - 0.5) * width * 0.4;

  // Capa de aguada
  ctx.beginPath();
  ctx.moveTo(x0 + jx, y0 + jy);
  ctx.lineTo(x1 + jx, y1 + jy);
  ctx.strokeStyle = rgba(pigment, opacity * 0.18);
  ctx.lineWidth   = width * 2.2;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Capa de pigmento concentrado
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = rgba(pigment, opacity);
  ctx.lineWidth   = width;
  ctx.lineCap     = 'round';
  ctx.stroke();
}