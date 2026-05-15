// Conversión de partículas a buffer de posiciones para Three.js.
//
// Responsabilidad única: Particle[] → Float32Array de posiciones.
// Three.js Points necesita las posiciones como un array plano
// de 3 floats por partícula: [x0,y0,z0, x1,y1,z1, ...]
//
// El espacio de simulación [0,1]² se mapea al espacio de Three.js [-1,1]²

import { Particle } from '@/lib';

// Convierte el array de partículas a un buffer de posiciones.
// El buffer resultante tiene particleCount * 3 elementos.
export function particlesToPositions(
  particles: Particle[],
  out: Float32Array
): void {
  for (let i = 0; i < particles.length; i++) {
    const p      = particles[i];
    const offset = i * 3;

    // Mapeo [0,1] → [-1,1]
    out[offset]     = p.position.x * 2 - 1;
    out[offset + 1] = -(p.position.y * 2 - 1); // Y invertida
    out[offset + 2] = 0;
  }
}

// Convierte el trail de una partícula a posiciones para dibujar su estela.
// Retorna un Float32Array con las posiciones del trail en orden cronológico inverso.
export function particleTrailToPositions(particle: Particle): Float32Array {
  const trail  = particle.trail;
  const buffer = new Float32Array(trail.length * 3);

  for (let i = 0; i < trail.length; i++) {
    const offset = i * 3;
    buffer[offset]     = trail[i].x * 2 - 1;
    buffer[offset + 1] = -(trail[i].y * 2 - 1);
    buffer[offset + 2] = 0;
  }

  return buffer;
}