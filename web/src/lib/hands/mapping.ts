// Mapeo de datos geométricos y gestos de las manos a parámetros del campo electromagnético.
//
// Este módulo es el equivalente de audio/mapping.ts pero para el modo manos.
// Convierte las medidas físicas de las manos (apertura, posición, velocidad, gestos)
// en las variables de las ecuaciones de Maxwell que controlan la simulación.
//
// Filosofía del mapeo:
// La mano izquierda controla parámetros escalares del campo (intensidad, densidad, masa).
// La mano derecha controla parámetros dinámicos (frecuencia, modulación, dirección).
// La interacción entre ambas manos genera fenómenos emergentes (resonancia, interferencia).
//
// Esta división es analógica a la de un instrumento como el theremin,
// donde cada mano controla una dimensión independiente del sonido y el campo.

import { FieldParams, defaultFieldParams } from "@/store/types/field.types";
import { HandData, HandPhysicalParams, HandGesture } from "@/store/types/hands.types";
import {
  handAperture,
  handCentroid,
  handTilt,
  handVelocity,
  pinchDistance,
  handsInteractionDistance,
} from "./geometry";
import { recognizeGesture } from "./gestures";
import { LandmarkPoint } from "@/store/types/hands.types";

// Configuración del mapeo manos → campo.
// Permite ajustar la sensibilidad de cada parámetro de forma independiente.
export interface HandMappingConfig {
  // Sensibilidad de la velocidad de la mano para inyección de energía.
  // Valores altos hacen el campo más reactivo a movimientos rápidos.
  velocitySensitivity: number;

  // Rango de frecuencias mapeadas desde la posición Y de la mano derecha.
  // minFreq cuando la mano está abajo, maxFreq cuando está arriba.
  // En Lumyra: mapea a omega (ω = 2πf).
  minOmega: number;
  maxOmega: number;

  // Suavizado temporal entre frames, entre 0 y 1.
  // Igual que en audio/mapping.ts, evita cambios bruscos.
  smoothing: number;
}

// Configuración por defecto del mapeo
export const defaultHandMappingConfig: HandMappingConfig = {
  velocitySensitivity: 8.0,
  minOmega: 0.05,
  maxOmega: 0.95,
  smoothing: 0.6,
};

// Aplica suavizado temporal de primer orden entre frames
function smooth(previous: number, current: number, factor: number): number {
  return factor * previous + (1 - factor) * current;
}

// Limita un valor al rango [0, 1]
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Interpola linealmente entre min y max usando t en [0,1]
function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * clamp01(t);
}

// Calcula los parámetros físicos derivados de los landmarks de una mano.
// Este objeto intermedio desacopla la geometría del mapeo a FieldParams,
// permitiendo usar HandPhysicalParams en otros contextos (síntesis de audio, UI).
export function computeHandPhysicalParams(
  landmarks: LandmarkPoint[],
  previousCentroid: { x: number; y: number } | null
): HandPhysicalParams {
  const centroid = handCentroid(landmarks);
  const velocity = previousCentroid
    ? handVelocity(centroid, previousCentroid)
    : 0;

  return {
    aperture: handAperture(landmarks),
    position: { x: centroid.x, y: centroid.y },
    velocity,
    tilt: handTilt(landmarks),
  };
}

// Mapea los parámetros de la mano izquierda a variables del campo.
//
// Mano izquierda → parámetros escalares (qué tan intenso es el campo):
//
// apertura → rho (ρ): densidad de carga eléctrica
//   Mano abierta = espacio lleno de cargas distribuidas (campo denso)
//   Puño cerrado = concentración máxima en un punto (campo intenso localizado)
//
// apertura → epsilon (ε₀): permitividad del vacío
//   Mano abierta = medio más permisivo, campo se propaga con menos resistencia
//   Puño cerrado = medio más rígido, campo se concentra
//
// velocidad → E_magnitude: magnitud del campo eléctrico
//   Movimiento rápido inyecta energía cinética al campo
//   Análogo al trabajo realizado por una fuerza externa sobre el campo
//
// posición Y → mu (μ₀): permeabilidad magnética
//   Mano arriba = mayor permeabilidad, las perturbaciones se propagan más
//   Mano abajo = menor permeabilidad, el campo es más estático
function mapLeftHand(
  params: HandPhysicalParams,
  gesture: HandGesture,
  previous: FieldParams,
  config: HandMappingConfig
): Partial<FieldParams> {
  const s = config.smoothing;

  // rho (ρ): apertura mapea directamente a densidad de carga
  const rawRho = params.aperture;

  // epsilon (ε₀): apertura invertida — mano abierta = alta permitividad
  const rawEpsilon = params.aperture;

  // E_magnitude: velocidad normalizada por la sensibilidad configurada
  const rawEMagnitude = clamp01(params.velocity * config.velocitySensitivity);

  // mu (μ₀): posición Y invertida (y=0 es arriba en coordenadas de cámara)
  const rawMu = 1 - params.position.y;

  // Modificación por gesto: el puño cierra la energía, multiplicando rho
  const gestureFactor = gesture === "closed" ? 1.5 : gesture === "open" ? 0.8 : 1.0;

  return {
    rho:         smooth(previous.rho,         clamp01(rawRho * gestureFactor), s),
    epsilon:     smooth(previous.epsilon,     rawEpsilon,                      s),
    E_magnitude: smooth(previous.E_magnitude, rawEMagnitude,                   s),
    mu:          smooth(previous.mu,          rawMu,                           s),
  };
}

// Mapea los parámetros de la mano derecha a variables del campo.
//
// Mano derecha → parámetros dinámicos (cómo evoluciona el campo en el tiempo):
//
// posición Y → omega (ω): frecuencia angular de oscilación
//   Mano arriba = frecuencia alta = oscilaciones rápidas = longitud de onda corta
//   Mano abajo  = frecuencia baja = oscilaciones lentas = longitud de onda larga
//   La posición Y de la mano derecha actúa como el theremin clásico
//
// inclinación → dBdt (∂B/∂t): variación temporal del campo magnético
//   Por la ley de Faraday: ∇×E = -∂B/∂t
//   La inclinación de la mano modula la rotación de las líneas de campo
//
// apertura → J (densidad de corriente)
//   Una mano derecha abierta = mayor flujo de corriente en el campo
//
// velocidad → k (número de onda)
//   Movimientos rápidos de la mano derecha comprimen las ondas espacialmente
function mapRightHand(
  params: HandPhysicalParams,
  gesture: HandGesture,
  previous: FieldParams,
  config: HandMappingConfig
): Partial<FieldParams> {
  const s = config.smoothing;

  // omega (ω): posición Y invertida mapeada al rango [minOmega, maxOmega]
  // y=0 es la parte superior del frame, y=1 es la inferior
  const rawOmega = lerp(config.minOmega, config.maxOmega, 1 - params.position.y);

  // lambda (λ): inversamente proporcional a omega, λ = c/f ~ 1/ω
  const rawLambda = 1 - rawOmega;

  // dBdt (∂B/∂t): inclinación de la mano normalizada de [-π,π] a [0,1]
  const rawDBdt = clamp01((params.tilt + Math.PI) / (Math.PI * 2));

  // J: apertura de la mano derecha controla la corriente
  const rawJ = params.aperture;

  // k: velocidad de movimiento modula la frecuencia espacial
  const rawK = clamp01(params.velocity * config.velocitySensitivity * 0.5);

  return {
    omega:  smooth(previous.omega,  rawOmega,  s),
    lambda: smooth(previous.lambda, rawLambda, s),
    dBdt:   smooth(previous.dBdt,   rawDBdt,   s),
    J:      smooth(previous.J,      rawJ,      s),
    k:      smooth(previous.k,      rawK,      s),
  };
}

// Mapea el efecto de la interacción entre ambas manos.
//
// Cuando ambas manos están presentes, su distancia relativa genera
// un efecto emergente en el campo: análogo a la resonancia entre dos dipolos.
//
// Manos separadas = dos fuentes independientes, sin acoplamiento
// Manos juntas    = resonancia, las frecuencias de ambas fuentes se sincronizan
//
// La distancia entre manos modula rho y omega conjuntamente,
// produciendo un efecto de "interferencia constructiva" cuando se acercan.
function mapHandsInteraction(
  distance: number,
  previous: FieldParams,
  config: HandMappingConfig
): Partial<FieldParams> {
  // Distancia normalizada: 0 = manos juntas, 1 = manos en extremos opuestos
  const normalizedDistance = clamp01(distance);

  // La interacción amplifica rho cuando las manos se acercan
  const interactionBoost = clamp01(1 - normalizedDistance) * 0.3;

  return {
    rho: clamp01(previous.rho + interactionBoost),
  };
}

// Función principal de mapeo: HandData → FieldParams.
// Combina los efectos de la mano izquierda, derecha e interacción entre ambas.
// Si solo hay una mano, los parámetros de la otra permanecen en su valor anterior.
export function handDataToFieldParams(
  handData: HandData,
  previousParams: FieldParams,
  config: HandMappingConfig
): FieldParams {
  let result: FieldParams = { ...previousParams };

  if (handData.left?.detected) {
    const leftMapped = mapLeftHand(
      handData.left.params,
      handData.left.gesture,
      previousParams,
      config
    );
    result = { ...result, ...leftMapped };
  }

  if (handData.right?.detected) {
    const rightMapped = mapRightHand(
      handData.right.params,
      handData.right.gesture,
      previousParams,
      config
    );
    result = { ...result, ...rightMapped };
  }

  if (
    handData.left?.detected &&
    handData.right?.detected &&
    handData.handsDistance !== null
  ) {
    const interactionMapped = mapHandsInteraction(
      handData.handsDistance,
      result,
      config
    );
    result = { ...result, ...interactionMapped };
  }

  // Si no hay ninguna mano detectada, el campo regresa gradualmente al reposo
  if (!handData.left?.detected && !handData.right?.detected) {
    result = {
      rho:         smooth(result.rho,         defaultFieldParams.rho,         1 - 0.04),
      J:           smooth(result.J,           defaultFieldParams.J,           1 - 0.04),
      dBdt:        smooth(result.dBdt,        defaultFieldParams.dBdt,        1 - 0.04),
      epsilon:     smooth(result.epsilon,     defaultFieldParams.epsilon,     1 - 0.02),
      mu:          smooth(result.mu,          defaultFieldParams.mu,          1 - 0.02),
      E_magnitude: smooth(result.E_magnitude, defaultFieldParams.E_magnitude, 1 - 0.05),
      omega:       smooth(result.omega,       defaultFieldParams.omega,       1 - 0.03),
      lambda:      smooth(result.lambda,      defaultFieldParams.lambda,      1 - 0.03),
      k:           smooth(result.k,           defaultFieldParams.k,           1 - 0.03),
    };
  }

  return result;
}