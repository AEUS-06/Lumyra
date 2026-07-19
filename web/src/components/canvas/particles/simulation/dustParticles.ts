// Simulación de polvo de pigmento suspendido.
//
// El polvo es el detalle más sutil del lienzo — pequeñas motas de color
// que aparecen con la energía del audio y flotan lentamente antes de
// desvanecerse, como partículas de pigmento en suspensión en agua.
//
// A diferencia de las flow particles, el polvo no sigue el campo eléctrico —
// solo tiene una física simple de gravedad invertida y deriva aleatoria.
//
// Responsabilidad única: el estado y la evolución del polvo de pigmento.
// No dibuja nada — eso es responsabilidad de particles/render/drawDust.ts.

import { Pigment, BLUE, CYAN } from '../../pictoric';

// Estado de una mota de polvo en un instante dado
export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: Pigment;
}

// Genera motas de polvo nuevas. La cantidad escala con la energía general
// del campo y el nivel de beat — silencio no genera polvo, un beat fuerte
// produce una ráfaga visible.
export function spawnDustParticles(
  width:  number,
  height: number,
  energy: number,
  beat:   number
): DustParticle[] {
  if (energy < 0.08 && beat < 0.08) return [];

  const count = Math.floor(energy * 3 + beat * 10);

  return Array.from({ length: count }, () => ({
    x:     Math.random() * width,
    y:     Math.random() * height,
    vx:    (Math.random() - 0.5) * 0.25,
    vy:    (Math.random() - 0.5) * 0.25 - 0.08,
    size:  0.3 + Math.random() * 0.7,
    life:  0.3 + Math.random() * 0.6,
    color: Math.random() > 0.5 ? BLUE : CYAN,
  }));
}

// Avanza una mota un paso: aplica deriva, gravedad invertida sutil
// y decaimiento de vida.
export function stepDustParticle(particle: DustParticle): DustParticle {
  return {
    ...particle,
    x:    particle.x + particle.vx,
    y:    particle.y + particle.vy,
    vy:   particle.vy + 0.00006,
    life: particle.life - 0.004,
  };
}

// Determina si una mota debe eliminarse: agotó su vida o salió del canvas.
export function shouldRemoveDustParticle(
  particle: DustParticle,
  width:    number,
  height:   number
): boolean {
  if (particle.life <= 0) return true;
  if (particle.x < 0 || particle.x > width) return true;
  if (particle.y < 0 || particle.y > height) return true;
  return false;
}

// Avanza el sistema completo un frame: mueve todas las motas existentes,
// elimina las agotadas, y agrega nuevas según la energía actual.
// Limita el total para evitar crecimiento sin control en sesiones largas.
export function updateDustParticles(
  particles: DustParticle[],
  width:     number,
  height:    number,
  energy:    number,
  beat:      number,
  maxCount:  number = 180
): DustParticle[] {
  const stepped = particles
    .map(stepDustParticle)
    .filter((p) => !shouldRemoveDustParticle(p, width, height));

  const withNew = [...stepped, ...spawnDustParticles(width, height, energy, beat)];

  return withNew.length > maxCount ? withNew.slice(-maxCount) : withNew;
}