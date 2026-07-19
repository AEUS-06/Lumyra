// Paleta de pigmentos y funciones de color para Lumyra.
//
// Los colores se definen como pigmentos físicos — ningún valor es 0 o 255 absoluto.
// Siempre hay mezcla, como en pintura real. Esto da calidez y evita
// el aspecto sintético de los colores digitales puros.
//
// Responsabilidad única: definir colores y transformaciones de color.
// No sabe nada de canvas, de React ni del store.

// Tipo unión para contextos de canvas — acepta tanto el contexto del DOM
// como el de OffscreenCanvas. Ambos exponen la misma API de dibujo.
// Se define aquí porque todas las funciones de pictoric/ lo necesitan.
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// Tipo de pigmento — tupla RGB normalizada en [0,1]
export type Pigment = [number, number, number];

// ─── Paleta de pigmentos ──────────────────────────────────────────────────────

// Azul ultramar — el campo eléctrico en reposo
export const BLUE:   Pigment = [0.22, 0.45, 0.95];

// Verde viridian / cian — campo activo, energía alta
export const CYAN:   Pigment = [0.00, 0.85, 0.60];

// Violeta dioxazine — carga negativa
export const PURPLE: Pigment = [0.55, 0.20, 0.90];

// Bermellón — beat, transiente de energía
export const RED:    Pigment = [0.85, 0.30, 0.20];

// Negro marfil — contornos de tinta estilo cómic
export const BLACK:  Pigment = [0.05, 0.05, 0.05];

// Blanco titanio — ligeramente crudo, no puro digital
export const WHITE:  Pigment = [0.95, 0.93, 0.88];

// Negro carbón mate — fondo base, nunca negro absoluto
export const BG:     Pigment = [0.05, 0.05, 0.06];

// ─── Transformaciones de color ────────────────────────────────────────────────

// Convierte un pigmento [r,g,b] en [0,1] a string rgba listo para canvas.
// Alpha se recorta automáticamente a [0,1].
export function rgba(pigment: Pigment, alpha: number): string {
  const r = Math.round(pigment[0] * 255);
  const g = Math.round(pigment[1] * 255);
  const b = Math.round(pigment[2] * 255);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

// Mezcla dos pigmentos linealmente con factor t en [0,1].
// t=0 devuelve a, t=1 devuelve b. Como mezclar pintura en paleta.
export function mixPigment(a: Pigment, b: Pigment, t: number): Pigment {
  const c = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * c,
    a[1] + (b[1] - a[1]) * c,
    a[2] + (b[2] - a[2]) * c,
  ];
}

// Selecciona el pigmento del campo según intensidad normalizada [0,1]
// y nivel de beat [0,1].
//
// El color viaja por tres zonas:
// baja intensidad  → BG mezclado con BLUE  (campo débil, vacío casi en reposo)
// media intensidad → BLUE mezclado con CYAN (campo activo)
// alta intensidad  → CYAN mezclado con WHITE (campo intenso, cerca de fuente)
//
// El beat empuja transitoriamente hacia WHITE en todos los rangos.
export function fieldPigment(intensity: number, beat: number): Pigment {
  const t = Math.min(intensity + beat * 0.25, 1);
  if (t < 0.35) return mixPigment(BG,   BLUE,  t / 0.35);
  if (t < 0.70) return mixPigment(BLUE,  CYAN,  (t - 0.35) / 0.35);
  return              mixPigment(CYAN,  WHITE, (t - 0.70) / 0.30);
}