// Cálculo de intensidades por vértice para las líneas de campo.
//
// Responsabilidad única: FieldLine[] → Float32Array de intensidades.
// Cada vértice recibe una intensidad [0,1] que el fragment shader
// usa para determinar su color en la paleta electromagnética.
//
// La intensidad de cada vértice se calcula a partir de:
// - La posición del vértice en la línea (más brillante cerca de las fuentes)
// - La energía local del campo en ese punto (|E| normalizado)

import { FieldLine } from '@/lib';
import { countLineVertices } from './fieldLinesToBuffers';

// Calcula la intensidad de un punto según su posición relativa en la línea.
// Los puntos cercanos al inicio (semilla, cerca de la fuente) son más brillantes.
// La intensidad decae suavemente hacia el final de la línea.
// t: posición normalizada en la línea [0,1], donde 0 es el inicio (fuente).
function intensityByPosition(t: number): number {
  // Decaimiento exponencial desde la fuente
  return Math.exp(-t * 2.5);
}

// Convierte líneas de campo a un Float32Array de intensidades por vértice.
// El resultado es compatible con BufferAttribute de Three.js (itemSize: 1).
// Se genera una intensidad por cada vértice del par de cada segmento.
export function fieldLinesToIntensities(lines: FieldLine[]): Float32Array {
  const vertexCount  = countLineVertices(lines);
  const intensities  = new Float32Array(vertexCount);
  let offset = 0;

  for (const line of lines) {
    const totalPoints = line.points.length;
    if (totalPoints < 2) continue;

    for (let i = 0; i < totalPoints - 1; i++) {
      // Posición normalizada del par de vértices en la línea
      const t0 = i / (totalPoints - 1);
      const t1 = (i + 1) / (totalPoints - 1);

      intensities[offset++] = intensityByPosition(t0);
      intensities[offset++] = intensityByPosition(t1);
    }
  }

  return intensities;
}