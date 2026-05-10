// Álgebra vectorial 2D para la simulación del campo electromagnético.
// Este módulo no tiene dependencias externas — es la base de toda la lib.
// Todos los demás módulos de field/ importan desde aquí.
//
// Se usa una interfaz en lugar de una clase para mantener los vectores
// como objetos planos serializables, compatibles con transferencia a workers
// y con uniforms de GLSL sin conversión adicional.

// Vector en el espacio 2D. Representa posiciones, velocidades, fuerzas y
// el valor del campo eléctrico E en un punto dado del espacio.
export interface Vector2 {
  x: number;
  y: number;
}

// Crea un nuevo vector 2D.
export function vec2(x: number, y: number): Vector2 {
  return { x, y };
}

// Vector cero. Representa ausencia de campo, velocidad o fuerza.
export const ZERO: Vector2 = Object.freeze({ x: 0, y: 0 });

// Suma de dos vectores.
// En campos: E_total = E₁ + E₂ (principio de superposición)
export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

// Resta de dos vectores.
// Usado para calcular el vector desplazamiento r = punto - fuente,
// necesario en la ley de Coulomb: E = q·r̂ / |r|²
export function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

// Producto de un vector por un escalar.
// Usado para escalar el campo por la magnitud de la carga: E = q · r̂ / |r|²
export function scale(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s };
}

// Magnitud (módulo) del vector.
// En física: |E| representa la intensidad del campo eléctrico en V/m.
// |r| es la distancia entre un punto del espacio y una fuente de carga.
export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

// Magnitud al cuadrado. Evita la raíz cuadrada cuando solo se necesita comparar distancias.
// Más eficiente que magnitude() para comparaciones: |r|² < umbral² es equivalente a |r| < umbral.
export function magnitudeSq(v: Vector2): number {
  return v.x * v.x + v.y * v.y;
}

// Vector unitario en la dirección de v.
// r̂ = r / |r| aparece en la ley de Coulomb para indicar la dirección del campo.
// Si el vector es cero retorna ZERO para evitar división por cero.
export function normalize(v: Vector2): Vector2 {
  const mag = magnitude(v);
  if (mag < 1e-10) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

// Producto punto (escalar) entre dos vectores.
// a·b = |a||b|·cos(θ), donde θ es el ángulo entre ellos.
// Usado en la detección de gestos para medir alineación entre vectores de dedos.
export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

// Producto cruz en 2D. Devuelve el componente Z del vector resultante.
// a×b = aₓ·bᵧ - aᵧ·bₓ
// El signo indica si b está a la izquierda (positivo) o derecha (negativo) de a.
// Usado para calcular la orientación relativa de los dedos y la inclinación de la mano.
export function cross(a: Vector2, b: Vector2): number {
  return a.x * b.y - a.y * b.x;
}

// Distancia euclidiana entre dos puntos.
// |r| = |p₂ - p₁| — la distancia aparece en el denominador de la ley de Coulomb.
export function distance(a: Vector2, b: Vector2): number {
  return magnitude(sub(a, b));
}

// Distancia al cuadrado entre dos puntos. Más eficiente que distance() cuando
// solo se necesita comparar o cuando se usará en cálculos donde de todas formas
// se elevaría al cuadrado.
export function distanceSq(a: Vector2, b: Vector2): number {
  return magnitudeSq(sub(a, b));
}

// Interpolación lineal entre dos vectores.
// lerp(a, b, 0) = a, lerp(a, b, 1) = b
// Usado para transiciones suaves del campo cuando cambia de modo o al aplicar damping.
export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

// Rota un vector un ángulo theta en radianes en sentido antihorario.
// Aplicación de la matriz de rotación 2D:
// [cos θ  -sin θ] [x]
// [sin θ   cos θ] [y]
// Usado para calcular la dirección de emisión de líneas de campo alrededor de una fuente.
export function rotate(v: Vector2, theta: number): Vector2 {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

// Ángulo del vector respecto al eje X positivo, en radianes.
// Rango: [-π, π]. Equivalente a atan2(y, x).
// Usado para determinar la dirección del campo en un punto dado.
export function angle(v: Vector2): number {
  return Math.atan2(v.y, v.x);
}

// Limita la magnitud del vector a un valor máximo.
// Si |v| <= max, retorna v sin cambios.
// Si |v| > max, retorna v normalizado y escalado a max.
// Usado en la dinámica de partículas para evitar velocidades infinitas
// cuando una partícula se acerca demasiado a una fuente de carga.
export function clampMagnitude(v: Vector2, max: number): Vector2 {
  const magSq = magnitudeSq(v);
  if (magSq <= max * max) return v;
  return scale(normalize(v), max);
}

// Proyección ortogonal de v sobre la dirección de onto.
// proj = (v·onto / |onto|²) · onto
// Usado en el cálculo de componentes del campo en direcciones específicas.
export function project(v: Vector2, onto: Vector2): Vector2 {
  const d = magnitudeSq(onto);
  if (d < 1e-10) return { x: 0, y: 0 };
  return scale(onto, dot(v, onto) / d);
}