// Simulación de partículas de flujo del campo electromagnético.
//
// Una flow particle es un elemento puramente visual — no es una carga física
// como las de lib/field/particles.ts. Nace cerca de una fuente positiva,
// sigue la dirección del campo eléctrico normalizado, y se desvanece
// al llegar a una fuente negativa o agotar su tiempo de vida.
//
// Es la base del efecto de "flujo vivo" del campo: muchas partículas
// pequeñas viajando a lo largo de las líneas de fuerza en lugar de
// líneas estáticas dibujadas de una vez.
//
// Responsabilidad única: el estado y la evolución de las flow particles.
// No dibuja nada — eso es responsabilidad de particles/render/drawFlowParticles.ts.

import { electricField, vec2 } from '@/lib';
import { FieldSource } from '@/store/types/field.types';

// Estado de una partícula de flujo en un instante dado
export interface FlowParticle {
  // Posición normalizada [0,1]
  x: number;
  y: number;

  // Edad actual en frames
  age: number;

  // Edad máxima antes de desvanecerse — varía por partícula para
  // evitar que todas mueran al mismo tiempo
  maxAge: number;

  // Velocidad de avance por frame a lo largo del campo
  speed: number;

  // Intensidad local del campo en la posición actual — se recalcula en step()
  intensity: number;

  // Tamaño base de la partícula al dibujarse
  size: number;

  // Carga de la fuente que la originó — determina el color en el render
  charge: number;
}

// Genera partículas nuevas distribuidas alrededor de las fuentes positivas.
// Las semillas se reparten en ángulo uniforme con una pequeña variación
// aleatoria de fase para que el flujo no se vea sincronizado artificialmente.
export function spawnFlowParticles(
  sources: FieldSource[],
  count:   number,
  beat:    number
): FlowParticle[] {
  const result: FlowParticle[] = [];
  const positiveSources = sources.filter((s) => s.charge > 0);
  if (positiveSources.length === 0) return result;

  const perSource = Math.ceil(count / positiveSources.length);

  for (const src of positiveSources) {
    for (let i = 0; i < perSource; i++) {
      const angle = (i / perSource) * Math.PI * 2 + Math.random() * 0.4;
      const seedRadius = 0.015 + Math.random() * 0.015;

      result.push({
        x:         src.position.x + Math.cos(angle) * seedRadius,
        y:         src.position.y + Math.sin(angle) * seedRadius,
        age:       Math.floor(Math.random() * 40),
        maxAge:    90 + Math.floor(Math.random() * 130),
        speed:     0.0022 + Math.random() * 0.0022,
        intensity: src.intensity,
        size:      0.5 + Math.random() * 1.2 + beat * 0.8,
        charge:    src.charge,
      });
    }
  }

  return result;
}

// Avanza una partícula un paso siguiendo la dirección del campo eléctrico normalizado.
// Si el campo es demasiado débil en su posición, se marca para eliminación
// forzando su edad al máximo.
export function stepFlowParticle(
  particle: FlowParticle,
  sources:  FieldSource[]
): FlowParticle {
  const E   = electricField(vec2(particle.x, particle.y), sources);
  const mag = Math.sqrt(E.x * E.x + E.y * E.y);

  if (mag < 1e-7) {
    return { ...particle, age: particle.maxAge };
  }

  return {
    ...particle,
    x:         particle.x + (E.x / mag) * particle.speed,
    y:         particle.y + (E.y / mag) * particle.speed,
    age:       particle.age + 1,
    intensity: Math.min(mag * 1.6, 1),
  };
}

// Determina si una partícula debe eliminarse: salió del canvas,
// agotó su vida, o llegó suficientemente cerca de una fuente negativa.
export function shouldRemoveFlowParticle(
  particle: FlowParticle,
  sources:  FieldSource[]
): boolean {
  if (particle.x < -0.08 || particle.x > 1.08) return true;
  if (particle.y < -0.08 || particle.y > 1.08) return true;
  if (particle.age >= particle.maxAge) return true;

  const negativeSource = sources.find((s) => s.charge < 0);
  if (negativeSource) {
    const dx = particle.x - negativeSource.position.x;
    const dy = particle.y - negativeSource.position.y;
    if (dx * dx + dy * dy < 0.0003) return true;
  }

  return false;
}

// Avanza el sistema completo un frame: mueve todas las partículas,
// elimina las que corresponda, y repone hasta alcanzar el objetivo.
export function updateFlowParticles(
  particles: FlowParticle[],
  sources:   FieldSource[],
  target:    number,
  beat:      number
): FlowParticle[] {
  if (sources.length === 0) return [];

  const stepped = particles
    .map((p) => stepFlowParticle(p, sources))
    .filter((p) => !shouldRemoveFlowParticle(p, sources));

  if (stepped.length < target * 0.55) {
    return [...stepped, ...spawnFlowParticles(sources, target - stepped.length, beat)];
  }

  return stepped;
}