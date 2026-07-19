// Utilidades de renderizado pictórico para Lumyra.
// Implementa las técnicas de acuarela, óleo y cómic descritas en DISEÑO-SIMULADOR.md.
// Son funciones puras — solo dependen de canvas 2D, sin React ni store.

// Tipo unión que acepta tanto CanvasRenderingContext2D como OffscreenCanvasRenderingContext2D.
// Ambos exponen la misma API de dibujo — la diferencia es solo en métodos del DOM
// que no usamos aquí (getContextAttributes, drawFocusIfNeeded).
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// ─── Paleta de pigmentos ──────────────────────────────────────────────────────

export const PIGMENT = {
  BLUE:   [0.22, 0.45, 0.95] as [number, number, number],
  CYAN:   [0.00, 0.85, 0.60] as [number, number, number],
  PURPLE: [0.55, 0.20, 0.90] as [number, number, number],
  RED:    [0.85, 0.30, 0.20] as [number, number, number],
  BLACK:  [0.05, 0.05, 0.05] as [number, number, number],
  WHITE:  [0.95, 0.93, 0.88] as [number, number, number],
  BG:     [0.05, 0.05, 0.06] as [number, number, number],
} as const;

export function rgba(
  pigment: [number, number, number],
  alpha:   number
): string {
  const r = Math.round(pigment[0] * 255);
  const g = Math.round(pigment[1] * 255);
  const b = Math.round(pigment[2] * 255);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

export function mixPigment(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function fieldPigment(
  intensity: number,
  beat:      number
): [number, number, number] {
  const t = Math.min(intensity + beat * 0.25, 1);
  if (t < 0.35) return mixPigment(PIGMENT.BG,   PIGMENT.BLUE,  t / 0.35);
  if (t < 0.70) return mixPigment(PIGMENT.BLUE,  PIGMENT.CYAN,  (t - 0.35) / 0.35);
  return              mixPigment(PIGMENT.CYAN,  PIGMENT.WHITE, (t - 0.70) / 0.30);
}

// ─── Técnica de acuarela ─────────────────────────────────────────────────────

export function washFill(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  pigment: [number, number, number],
  radius:  number,
  opacity: number
): void {
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

export function brushStroke(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  pigment: [number, number, number],
  size:    number,
  opacity: number
): void {
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

export function brushLine(
  ctx:     Ctx2D,
  x0:      number,
  y0:      number,
  x1:      number,
  y1:      number,
  pigment: [number, number, number],
  width:   number,
  opacity: number
): void {
  const jx = (Math.random() - 0.5) * width * 0.4;
  const jy = (Math.random() - 0.5) * width * 0.4;
  ctx.beginPath();
  ctx.moveTo(x0 + jx, y0 + jy);
  ctx.lineTo(x1 + jx, y1 + jy);
  ctx.strokeStyle = rgba(pigment, opacity * 0.18);
  ctx.lineWidth   = width * 2.2;
  ctx.lineCap     = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = rgba(pigment, opacity);
  ctx.lineWidth   = width;
  ctx.lineCap     = 'round';
  ctx.stroke();
}

// ─── Técnica de óleo ─────────────────────────────────────────────────────────

export function oilStroke(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  pigment: [number, number, number],
  size:    number,
  opacity: number
): void {
  for (let i = 0; i < 4; i++) {
    const dx = (Math.random() - 0.5) * size * 0.5;
    const dy = (Math.random() - 0.5) * size * 0.5;
    const s  = size * (0.5 + Math.random() * 0.5);
    const op = opacity * (0.4 + Math.random() * 0.6) / 4 * 2;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, s, 0, Math.PI * 2);
    ctx.fillStyle = rgba(pigment, op);
    ctx.fill();
  }
}

// ─── Técnica de cómic ────────────────────────────────────────────────────────

export function benDayPattern(
  ctx:     Ctx2D,
  x:       number,
  y:       number,
  w:       number,
  h:       number,
  pigment: [number, number, number],
  opacity: number,
  spacing: number = 8,
  dotSize: number = 1.2
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let px = x; px < x + w; px += spacing) {
    for (let py = y; py < y + h; py += spacing) {
      const s = dotSize * (0.7 + Math.random() * 0.6);
      ctx.beginPath();
      ctx.arc(px, py, s, 0, Math.PI * 2);
      ctx.fillStyle = rgba(pigment, opacity);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function inkOutline(
  ctx:    Ctx2D,
  x:      number,
  y:      number,
  radius: number,
  width:  number = 1.5
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(PIGMENT.BLACK, 0.85);
  ctx.lineWidth   = width;
  ctx.stroke();
}

export function comicFrame(
  ctx:       Ctx2D,
  x:         number,
  y:         number,
  w:         number,
  h:         number,
  bgOpacity: number = 0.88
): void {
  ctx.fillStyle = rgba(PIGMENT.BG, bgOpacity);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgba(PIGMENT.WHITE, 0.15);
  ctx.lineWidth   = 1;
  ctx.strokeRect(x, y, w, h);
}