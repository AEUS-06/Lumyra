// Dinámica de partículas cargadas en el campo electromagnético.
//
// Cada partícula es una carga de prueba que responde al campo eléctrico
// generado por las fuentes. La ecuación de movimiento es la segunda ley de Newton
// con la fuerza de Lorentz como fuerza neta:
//
// F = q(E + v×B)
//
// En la simulación 2D se omite el término magnético v×B porque requeriría
// un campo B perpendicular al plano, lo que complicaría la visualización.
// Se usa solo la componente eléctrica: F = q·E
//
// Esto es coherente con la situación física de partículas en reposo o
// moviéndose lentamente en un campo electrostático puro.

import { Vector2, vec2, add, scale, clampMagnitude, lerp, ZERO } from "./vector2";
import { electricField } from "./electricField";
import { FieldSource, FieldParams } from "@/store/types/field.types";

// Estado completo de una partícula en la simulación
export interface Particle {
  // Identificador único de la partícula
  id: number;

  // Posición en el espacio normalizado [0,1]²
  position: Vector2;

  // Velocidad actual en unidades por frame
  velocity: Vector2;

  // q: carga eléctrica de la partícula.
  // Positivo: la fuerza es en la dirección de E (sigue el campo).
  // Negativo: la fuerza es opuesta a E (va contra el campo).
  charge: number;

  // Masa de la partícula. Afecta la inercia: a = F/m = q·E/m
  // Masas mayores producen partículas más lentas y estables.
  mass: number;

  // Tiempo de vida restante en frames. Cuando llega a 0 la partícula se reinicia.
  lifetime: number;

  // Tiempo de vida máximo. Usado para calcular la opacidad: alpha = lifetime / maxLifetime
  maxLifetime: number;

  // Historial de posiciones para dibujar el trail de la partícula.
  // Se mantiene un máximo de trailLength posiciones anteriores.
  trail: Vector2[];

  // Longitud máxima del trail en frames
  trailLength: number;
}

// Configuración del sistema de partículas
export interface ParticleSystemConfig {
  // Número total de partículas en la simulación
  count: number;

  // Factor de amortiguamiento por frame. Reduce la velocidad gradualmente.
  // v(t+1) = v(t) · damping
  // Sin damping (1.0) las partículas aceleran indefinidamente.
  // Con damping cercano a 1 (0.98) hay una velocidad terminal natural.
  damping: number;

  // Velocidad máxima permitida en unidades por frame.
  // Evita que partículas cercanas a fuentes adquieran velocidades infinitas.
  maxSpeed: number;

  // Longitud del trail visual en frames
  trailLength: number;

  // Tiempo de vida mínimo y máximo de una partícula antes de reiniciarse, en frames
  minLifetime: number;
  maxLifetime: number;
}

// Configuración por defecto para escritorio
export const defaultParticleConfig: ParticleSystemConfig = {
  count: 80,
  damping: 0.98,
  maxSpeed: 0.008,
  trailLength: 20,
  minLifetime: 180,
  maxLifetime: 360,
};

// Configuración reducida para móvil
export const mobileParticleConfig: ParticleSystemConfig = {
  count: 40,
  damping: 0.97,
  maxSpeed: 0.008,
  trailLength: 12,
  minLifetime: 120,
  maxLifetime: 240,
};

// Crea una partícula nueva con posición aleatoria y velocidad inicial cero.
// La carga se asigna aleatoriamente positiva o negativa con igual probabilidad.
export function createParticle(id: number, config: ParticleSystemConfig): Particle {
  const lifetime = config.minLifetime + Math.floor(Math.random() * (config.maxLifetime - config.minLifetime));
  return {
    id,
    position: vec2(Math.random(), Math.random()),
    velocity: ZERO,
    charge: Math.random() > 0.5 ? 1 : -1,
    mass: 0.5 + Math.random() * 0.5,
    lifetime,
    maxLifetime: lifetime,
    trail: [],
    trailLength: config.trailLength,
  };
}

// Inicializa el sistema completo de partículas.
export function createParticleSystem(config: ParticleSystemConfig): Particle[] {
  return Array.from({ length: config.count }, (_, i) => createParticle(i, config));
}

// Actualiza una partícula individual por un frame de simulación.
//
// El ciclo de actualización sigue las leyes de Newton con fuerza de Lorentz eléctrica:
//
// 1. Calcular el campo eléctrico en la posición de la partícula: E = electricField(p)
// 2. Calcular la fuerza:  F = q · E
// 3. Calcular la aceleración: a = F / m
// 4. Escalar por los parámetros del campo (rho modula la intensidad global)
// 5. Actualizar velocidad con damping: v = (v + a·dt) · damping
// 6. Limitar la velocidad máxima
// 7. Actualizar posición: x = x + v
// 8. Aplicar condiciones de frontera periódicas
// 9. Actualizar trail y tiempo de vida
export function updateParticle(
  particle: Particle,
  sources: FieldSource[],
  fieldParams: FieldParams,
  config: ParticleSystemConfig,
  dt: number = 1
): Particle {
  // 1. Campo eléctrico en la posición actual de la partícula
  const E = electricField(particle.position, sources);

  // 2 y 3. Fuerza y aceleración. rho (densidad de carga) escala la intensidad global del campo.
  // J (densidad de corriente) añade un término que representa el arrastre colectivo de cargas.
  const forceMagnitude = (particle.charge / particle.mass) * (0.1 + fieldParams.rho * 0.9);
  const acceleration = scale(E, forceMagnitude * dt);

  // 4. Perturbación adicional por variación del campo magnético (∂B/∂t).
  // Según la ley de Faraday (∇×E = -∂B/∂t), un campo magnético variable
  // induce un campo eléctrico rotacional. Se simula como una perturbación
  // perpendicular a la velocidad actual de la partícula.
  const faradayPerturbation: Vector2 = {
    x: -particle.velocity.y * fieldParams.dBdt * 0.5,
    y:  particle.velocity.x * fieldParams.dBdt * 0.5,
  };

  // 5. Actualizar velocidad con damping
  const newVelocity = clampMagnitude(
    scale(
      add(add(particle.velocity, acceleration), faradayPerturbation),
      config.damping
    ),
    config.maxSpeed
  );

  // 7. Actualizar posición
  const newPosition = add(particle.position, scale(newVelocity, dt));

  // 8. Condiciones de frontera periódicas: si la partícula sale por un lado,
  // reaparece por el lado opuesto. Mantiene el número de partículas constante
  // y produce un campo visualmente continuo sin bordes duros.
  const wrappedPosition = vec2(
    ((newPosition.x % 1) + 1) % 1,
    ((newPosition.y % 1) + 1) % 1
  );

  // 9. Actualizar trail: agregar posición actual y recortar al máximo
  const newTrail = [particle.position, ...particle.trail].slice(0, particle.trailLength);

  // Decrementar tiempo de vida
  const newLifetime = particle.lifetime - 1;

  return {
    ...particle,
    position: wrappedPosition,
    velocity: newVelocity,
    lifetime: newLifetime,
    trail: newTrail,
  };
}

// Actualiza todo el sistema de partículas por un frame.
// Las partículas con tiempo de vida agotado se reinician en posición aleatoria.
export function updateParticleSystem(
  particles: Particle[],
  sources: FieldSource[],
  fieldParams: FieldParams,
  config: ParticleSystemConfig,
  dt: number = 1
): Particle[] {
  return particles.map((particle) => {
    // Reiniciar partículas agotadas
    if (particle.lifetime <= 0) {
      return createParticle(particle.id, config);
    }
    return updateParticle(particle, sources, fieldParams, config, dt);
  });
}

// Calcula la opacidad de una partícula basándose en su tiempo de vida restante.
// La opacidad se reduce suavemente al final de la vida usando una curva cuadrática
// para evitar parpadeos abruptos al reiniciar.
export function particleAlpha(particle: Particle): number {
  const lifeRatio = particle.lifetime / particle.maxLifetime;
  // Fade-in rápido en los primeros frames, fade-out suave al final
  const fadeIn = Math.min(1, (particle.maxLifetime - particle.lifetime) / 10);
  const fadeOut = lifeRatio * lifeRatio;
  return Math.min(fadeIn, fadeOut);
}