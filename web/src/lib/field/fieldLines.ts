// Trazado de líneas de campo eléctrico mediante integración numérica.
//
// Una línea de campo eléctrico es una curva cuya tangente en cada punto
// es paralela al vector campo eléctrico E en ese punto.
// Matemáticamente: dp/dt = E(p) / |E(p)|
//
// Esta ecuación diferencial ordinaria (ODE) se integra numéricamente
// usando el método de Euler de primer orden:
// p(t + dt) = p(t) + E(p(t)) · dt
//
// Las líneas de campo tienen propiedades físicas importantes:
// - Salen de cargas positivas y terminan en cargas negativas
// - Nunca se cruzan entre sí (el campo tiene un único valor en cada punto)
// - Su densidad es proporcional a la intensidad del campo
// - Son siempre perpendiculares a las superficies equipotenciales

import { Vector2, vec2, add, scale, normalize, magnitude, rotate, ZERO } from "./vector2";
import { electricField } from "./electricField";
import { FieldSource } from "@/store/types/field.types";

// Configuración del algoritmo de trazado de líneas de campo.
// Separa los parámetros del algoritmo de los parámetros físicos
// para poder ajustar la calidad visual sin tocar la física.
export interface FieldLineConfig {
  // Número de líneas a trazar por fuente de carga.
  // Las semillas se distribuyen uniformemente en ángulo alrededor de la fuente:
  // θᵢ = i · (2π / linesPerSource)
  linesPerSource: number;

  // Número máximo de pasos de integración por línea.
  // Limita la longitud máxima de cada línea y el costo computacional.
  maxSteps: number;

  // Tamaño del paso de integración de Euler en unidades del espacio normalizado.
  // Valores más pequeños producen líneas más suaves pero requieren más pasos.
  // Rango recomendado: [0.003, 0.01]
  stepSize: number;

  // Radio inicial desde el que se lanzan las semillas alrededor de cada fuente.
  // Debe ser mayor que MIN_DISTANCE en electricField.ts para evitar la singularidad.
  seedRadius: number;

  // Margen fuera del canvas [0,1] en el que se considera que la línea salió del espacio.
  // Un margen pequeño positivo evita que las líneas se corten abruptamente en el borde.
  boundaryMargin: number;

  // Distancia mínima a una fuente de carga opuesta para terminar la línea.
  // Simula la terminación de líneas en cargas negativas como en electrostática real.
  terminationRadius: number;
}

// Configuración por defecto para dispositivos de escritorio
export const defaultFieldLineConfig: FieldLineConfig = {
  linesPerSource: 16,
  maxSteps: 200,
  stepSize: 0.005,
  seedRadius: 0.025,
  boundaryMargin: 0.05,
  terminationRadius: 0.02,
};

// Configuración reducida para dispositivos móviles.
// Menos líneas y pasos para mantener 60fps en hardware limitado.
export const mobileFieldLineConfig: FieldLineConfig = {
  linesPerSource: 8,
  maxSteps: 100,
  stepSize: 0.008,
  seedRadius: 0.025,
  boundaryMargin: 0.05,
  terminationRadius: 0.02,
};

// Resultado del trazado de una línea de campo individual.
// Contiene los puntos de la curva y metadatos sobre cómo terminó.
export interface FieldLine {
  // Secuencia de puntos que forman la línea de campo
  points: Vector2[];

  // Razón por la que el trazado se detuvo
  terminationReason: "boundary" | "sink" | "maxSteps" | "weakField";
}

// Verifica si un punto está fuera del espacio de simulación [0,1]²
// con un margen adicional para evitar cortes abruptos en los bordes.
function isOutOfBounds(p: Vector2, margin: number): boolean {
  return (
    p.x < -margin ||
    p.x > 1 + margin ||
    p.y < -margin ||
    p.y > 1 + margin
  );
}

// Verifica si el punto p está suficientemente cerca de una fuente
// de carga opuesta para considerar que la línea ha terminado ahí.
// En electrostática real las líneas de campo siempre terminan en cargas negativas.
function isNearOppositeCharge(
  p: Vector2,
  originCharge: number,
  sources: FieldSource[],
  radius: number
): boolean {
  return sources.some((source) => {
    if (Math.sign(source.charge) === Math.sign(originCharge)) return false;
    const dx = p.x - source.position.x;
    const dy = p.y - source.position.y;
    return dx * dx + dy * dy < radius * radius;
  });
}

// Traza una línea de campo eléctrico desde un punto semilla.
//
// El algoritmo de integración de Euler avanza paso a paso siguiendo
// la dirección del campo eléctrico normalizado:
// p(n+1) = p(n) + normalize(E(p(n))) · stepSize
//
// Se usa el campo normalizado (dirección unitaria) en lugar del campo completo
// para que todas las líneas avancen a la misma velocidad visual
// independientemente de la intensidad del campo en cada punto.
export function traceFieldLine(
  seed: Vector2,
  originCharge: number,
  sources: FieldSource[],
  config: FieldLineConfig
): FieldLine {
  const points: Vector2[] = [seed];
  let current = seed;

  for (let step = 0; step < config.maxSteps; step++) {
    const E = electricField(current, sources);
    const mag = magnitude(E);

    // Campo demasiado débil para continuar — lejos de todas las fuentes
    if (mag < 1e-6) {
      return { points, terminationReason: "weakField" };
    }

    // Avance de Euler: siguiente punto en la dirección del campo normalizado
    const direction = scale(E, 1 / mag);
    const next = add(current, scale(direction, config.stepSize));

    // Verificar si salió del canvas
    if (isOutOfBounds(next, config.boundaryMargin)) {
      return { points, terminationReason: "boundary" };
    }

    // Verificar si llegó a una carga opuesta
    if (isNearOppositeCharge(next, originCharge, sources, config.terminationRadius)) {
      points.push(next);
      return { points, terminationReason: "sink" };
    }

    points.push(next);
    current = next;
  }

  return { points, terminationReason: "maxSteps" };
}

// Genera todas las líneas de campo para un conjunto de fuentes.
//
// Para cada fuente con carga positiva se lanzan linesPerSource semillas
// distribuidas uniformemente en ángulo:
// seed_i = fuente + seedRadius · (cos(θᵢ), sin(θᵢ))
// donde θᵢ = i · 2π / linesPerSource
//
// Solo se trazan líneas desde cargas positivas hacia afuera.
// Las cargas negativas actúan como sumideros donde las líneas terminan.
// Esto refleja la convención física donde las líneas de campo van de + a -.
export function generateFieldLines(
  sources: FieldSource[],
  config: FieldLineConfig
): FieldLine[] {
  const lines: FieldLine[] = [];

  const positiveSources = sources.filter((s) => s.charge > 0);

  for (const source of positiveSources) {
    for (let i = 0; i < config.linesPerSource; i++) {
      const angle = (i / config.linesPerSource) * Math.PI * 2;
      const seed = vec2(
        source.position.x + Math.cos(angle) * config.seedRadius,
        source.position.y + Math.sin(angle) * config.seedRadius
      );
      const line = traceFieldLine(seed, source.charge, sources, config);
      lines.push(line);
    }
  }

  return lines;
}

// Genera líneas de campo para una fuente aislada sin cargas opuestas.
// Usado en el estado de reposo autónomo cuando no hay audio ni manos activas.
// Las líneas se trazan en ambas direcciones para simular un dipolo visual.
export function generateAutonomousFieldLines(
  center: Vector2,
  config: FieldLineConfig
): FieldLine[] {
  const dummySources: FieldSource[] = [
    {
      id: "auto-pos",
      position: { x: center.x - 0.15, y: center.y },
      charge: 1,
      intensity: 0.4,
      origin: "audio",
    },
    {
      id: "auto-neg",
      position: { x: center.x + 0.15, y: center.y },
      charge: -1,
      intensity: 0.4,
      origin: "audio",
    },
  ];

  return generateFieldLines(dummySources, config);
}