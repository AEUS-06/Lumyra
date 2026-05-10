// Cálculo del campo eléctrico en el espacio 2D de la simulación.
// Implementa el principio de superposición de la electrostática:
// el campo total en un punto es la suma vectorial de los campos
// producidos por cada fuente puntual de carga individualmente.
//
// Base física: Primera ecuación de Maxwell (ley de Gauss eléctrica)
// En forma integral: ∮ E·dA = Q_enc / ε₀
// Para una carga puntual en 3D: E(r) = q / (4πε₀) · r̂ / |r|²
// Para una carga lineal infinita en 2D (análogo usado en Lumyra):
// E(r) = q / (2πε₀) · r̂ / |r|
//
// En Lumyra se usa la versión 2D normalizada donde ε₀ está absorbida
// en la carga normalizada, permitiendo control artístico del campo
// sin perder coherencia con el comportamiento físico real.

import { Vector2, vec2, sub, normalize, scale, add, magnitude, ZERO } from "./vector2";
import { FieldSource } from "@/store/types/field.types";

// Distancia mínima permitida entre un punto de evaluación y una fuente.
// Evita la singularidad del campo en r → 0, donde E → ∞.
// En física real el campo de una carga puntual diverge en su posición exacta.
// Este umbral produce un campo visualmente coherente sin valores numéricos infinitos.
const MIN_DISTANCE = 0.01;

// Calcula el vector campo eléctrico E producido por una sola fuente puntual
// en el punto p del espacio normalizado [0,1]².
//
// Implementa la ley de Coulomb en 2D:
// E(p) = q · (p - r_fuente) / |p - r_fuente|²
//
// Donde:
//   q         es la carga normalizada de la fuente (positivo o negativo)
//   p - r     es el vector desplazamiento desde la fuente hasta el punto p
//   |p - r|   es la distancia entre el punto y la fuente
//
// El resultado es un vector que apunta alejándose de cargas positivas
// y acercándose a cargas negativas, exactamente como en electrostática real.
export function electricFieldFromSource(point: Vector2, source: FieldSource): Vector2 {
  const sourcePos = vec2(source.position.x, source.position.y);
  const displacement = sub(point, sourcePos);
  const dist = magnitude(displacement);

  // Si el punto está demasiado cerca de la fuente, retorna campo cero
  // para evitar la singularidad. El campo real sería extremadamente grande
  // pero en la simulación produce artefactos visuales no deseados.
  if (dist < MIN_DISTANCE) return ZERO;

  // Magnitud del campo en 2D: |E| = |q| / |r|
  // A diferencia del caso 3D donde decae como 1/r², en 2D el campo de una
  // distribución de carga lineal decae como 1/r. Esto produce líneas de campo
  // visualmente más estables y menos concentradas cerca de las fuentes.
  const fieldMagnitude = source.charge / dist;

  // Dirección: el vector normalizado desde la fuente hasta el punto.
  // Para carga positiva: el campo apunta hacia afuera (repulsión).
  // Para carga negativa: charge es negativo, el campo apunta hacia adentro (atracción).
  const direction = normalize(displacement);

  return scale(direction, fieldMagnitude);
}

// Calcula el campo eléctrico total en el punto p por superposición de todas las fuentes.
//
// Principio de superposición electromagnética:
// E_total(p) = Σᵢ Eᵢ(p) = Σᵢ qᵢ · (p - rᵢ) / |p - rᵢ|²
//
// Este principio es exacto en electrostática clásica y es consecuencia directa
// de la linealidad de las ecuaciones de Maxwell. Los campos de múltiples cargas
// simplemente se suman — no interactúan entre sí en el vacío.
export function electricField(point: Vector2, sources: FieldSource[]): Vector2 {
  if (sources.length === 0) return ZERO;

  return sources.reduce<Vector2>(
    (total, source) => add(total, electricFieldFromSource(point, source)),
    ZERO
  );
}

// Calcula la energía potencial eléctrica en el punto p relativa a todas las fuentes.
//
// En 2D, el potencial de una carga puntual es:
// V(p) = -q · ln(|p - r_fuente|) / (2π)
// A diferencia del caso 3D donde V = q / (4πε₀|r|)
//
// El potencial escalar es útil para:
// - Colorear el campo con un gradiente de energía
// - Dibujar superficies equipotenciales
// - Verificar que las líneas de campo son perpendiculares a las equipotenciales
export function electricPotential(point: Vector2, sources: FieldSource[]): number {
  if (sources.length === 0) return 0;

  return sources.reduce<number>((total, source) => {
    const sourcePos = vec2(source.position.x, source.position.y);
    const displacement = sub(point, sourcePos);
    const dist = magnitude(displacement);

    if (dist < MIN_DISTANCE) return total;

    // Potencial logarítmico en 2D: V = -q · ln(r)
    return total - source.charge * Math.log(dist);
  }, 0);
}

// Calcula la intensidad normalizada del campo en un punto, entre 0 y 1.
// Usado para mapear la magnitud del campo a valores de color y opacidad en el shader.
// La normalización usa una función sigmoide logarítmica para comprimir el rango dinámico:
// sin esta compresión, el campo cerca de las fuentes dominaría visualmente
// y el campo lejos de ellas sería invisible.
export function fieldIntensity(point: Vector2, sources: FieldSource[], scale_factor: number = 1): number {
  const E = electricField(point, sources);
  const mag = magnitude(E);
  // Compresión logarítmica del rango dinámico
  return Math.tanh(mag * scale_factor);
}