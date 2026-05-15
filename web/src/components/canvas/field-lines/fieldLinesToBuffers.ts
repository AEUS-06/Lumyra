// Conversión de líneas de campo a buffer de posiciones para Three.js.
//
// Responsabilidad única: FieldLine[] → Float32Array de posiciones.
// Three.js LineSegments necesita los vértices como pares de puntos:
// cada segmento de línea se define por dos vértices consecutivos.
//
// Para una línea con N puntos se generan N-1 segmentos,
// cada uno con 2 vértices × 3 coordenadas (x, y, z) = 6 floats.

import { FieldLine } from '@/lib';

// Calcula el número total de vértices necesarios para todas las líneas.
// Cada segmento necesita 2 vértices. Una línea de N puntos tiene N-1 segmentos.
export function countLineVertices(lines: FieldLine[]): number {
  return lines.reduce((total, line) => {
    return total + Math.max(0, line.points.length - 1) * 2;
  }, 0);
}

// Convierte un array de líneas de campo a un Float32Array de posiciones.
// El resultado es compatible con BufferAttribute de Three.js (itemSize: 3).
//
// Formato de salida: [x0,y0,z0, x1,y1,z1, x0,y0,z0, x1,y1,z1, ...]
// donde cada par representa un segmento de línea.
//
// El espacio de simulación [0,1]² se mapea al espacio de Three.js [-1,1]²
// multiplicando por 2 y restando 1: coordTHREE = coord * 2 - 1
export function fieldLinesToPositions(lines: FieldLine[]): Float32Array {
  const vertexCount = countLineVertices(lines);
  const positions   = new Float32Array(vertexCount * 3);
  let offset = 0;

  for (const line of lines) {
    for (let i = 0; i < line.points.length - 1; i++) {
      const p0 = line.points[i];
      const p1 = line.points[i + 1];

      // Mapeo [0,1] → [-1,1] para el espacio de Three.js
      positions[offset++] = p0.x * 2 - 1;
      positions[offset++] = -(p0.y * 2 - 1); // Y invertida: canvas y Three.js tienen Y opuesta
      positions[offset++] = 0;

      positions[offset++] = p1.x * 2 - 1;
      positions[offset++] = -(p1.y * 2 - 1);
      positions[offset++] = 0;
    }
  }

  return positions;
}