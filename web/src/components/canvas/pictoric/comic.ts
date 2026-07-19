// Técnicas de renderizado inspiradas en el lenguaje visual del cómic.
//
// El cómic se caracteriza por tres elementos gráficos principales:
// 1. Trama Ben Day — patrón de puntos para simular tonos intermedios
// 2. Contorno de tinta — línea negra marcada que define las formas
// 3. Marco de viñeta — recuadro que encuadra el contenido narrativo
//
// Responsabilidad única: implementar las primitivas de cómic.
// No sabe nada de física, partículas ni del store.

import { Ctx2D, Pigment, rgba, BLACK, BG, WHITE } from './pigments';

// Trama Ben Day — patrón regular de puntos que simula tonos intermedios.
//
// En la impresión offset clásica, los tonos de color se lograban con
// puntos de tamaño variable a intervalos regulares. Roy Lichtenstein
// los convirtió en elemento estético del Pop Art.
//
// En Lumyra se usa en zonas de baja energía del campo para dar textura
// al "vacío" electromagnético. Los puntos tienen variación aleatoria
// de tamaño para evitar el aspecto mecánico de un patrón perfecto.
export function benDayPattern(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  w:       number,
  h:       number,
  pigment: Pigment,
  opacity: number,
  spacing: number = 8,
  dotSize: number = 1.2
): void {
  if (opacity <= 0.002) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  for (let px = x; px < x + w; px += spacing) {
    for (let py = y; py < y + h; py += spacing) {
      // Variación aleatoria de tamaño — evita la rigidez mecánica
      const s = dotSize * (0.7 + Math.random() * 0.6);
      ctx.beginPath();
      ctx.arc(px, py, s, 0, Math.PI * 2);
      ctx.fillStyle = rgba(pigment, opacity);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Contorno de tinta — línea negra marcada alrededor de un círculo.
//
// En el cómic, el delineado negro define las formas con claridad absoluta.
// No hay degradados ni suavizados — la línea es directa y tiene peso.
// Usado para delinear las fuentes de campo electromagnético.
export function inkOutline(
  ctx:    Ctx2D,
  x:      number,
  y:      number,
  radius: number,
  width:  number = 1.5
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(BLACK, 0.85);
  ctx.lineWidth   = width;
  ctx.stroke();
}

// Marco de viñeta — recuadro oscuro con borde sutil.
//
// En el cómic, la viñeta es la unidad narrativa fundamental —
// un espacio delimitado que contiene un momento de la historia.
// En Lumyra encuadra el waveform de audio, convirtiéndolo en
// un elemento gráfico con peso visual propio.
export function comicFrame(
  ctx:       Ctx2D,
  x:         number,
  y:         number,
  w:         number,
  h:         number,
  bgOpacity: number = 0.88
): void {
  // Fondo oscuro semitransparente
  ctx.fillStyle = rgba(BG, bgOpacity);
  ctx.fillRect(x, y, w, h);

  // Borde sutil — línea de tinta diluida, no completamente negra
  ctx.strokeStyle = rgba(WHITE, 0.15);
  ctx.lineWidth   = 1;
  ctx.strokeRect(x, y, w, h);
}