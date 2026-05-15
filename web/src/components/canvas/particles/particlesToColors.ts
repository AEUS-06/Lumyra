// Cálculo de intensidades por partícula para el shader.
//
// Responsabilidad única: Particle[] → Float32Array de intensidades.
// Cada partícula recibe una intensidad [0,1] derivada de:
// - Su energía cinética: velocidad normalizada por maxSpeed
// - Su tiempo de vida restante: fade-in y fade-out suaves
// - Su carga: partículas positivas y negativas tienen tonos ligeramente distintos

import { Particle, particleAlpha } from '@/lib';

// Calcula la intensidad de una partícula a partir de su estado físico.
// La intensidad combina la energía cinética con el alpha de tiempo de vida.
function particleIntensity(particle: Particle, maxSpeed: number): number {
  const speed    = Math.sqrt(
    particle.velocity.x * particle.velocity.x +
    particle.velocity.y * particle.velocity.y
  );
  const energy   = Math.min(speed / maxSpeed, 1);
  const alpha    = particleAlpha(particle);

  // Las partículas rápidas son más brillantes — representan mayor energía cinética
  return alpha * (0.3 + energy * 0.7);
}

// Convierte el array de partículas a un buffer de intensidades.
// El buffer resultante tiene particleCount * 1 elemento por partícula.
// maxSpeed: velocidad máxima configurada en el sistema de partículas, para normalizar.
export function particlesToIntensities(
  particles: Particle[],
  out: Float32Array,
  maxSpeed: number = 0.008
): void {
  for (let i = 0; i < particles.length; i++) {
    out[i] = particleIntensity(particles[i], maxSpeed);
  }
}