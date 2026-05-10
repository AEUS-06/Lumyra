// Mapeo de datos espectrales de audio a parámetros físicos del campo electromagnético.
//
// Este módulo es el traductor entre el dominio del audio y el dominio de la física.
// Convierte energías de bandas espectrales (AudioBands) en las variables de las
// ecuaciones de Maxwell (FieldParams) que controlan la simulación visual.
//
// La filosofía del mapeo es coherente con la física pero no estrictamente literal:
// se busca que el comportamiento visual resultante sea intuitivo y estético,
// respetando las relaciones cualitativas entre las variables electromagnéticas.
//
// Cada mapeo tiene una justificación física:
// - Los graves (bass) tienen mayor energía y menor frecuencia → mayor densidad de carga ρ
// - Las frecuencias medias (mid) transportan la mayor parte de la información tímbrica → corriente J
// - Los agudos (high) oscilan rápidamente → modulan la variación temporal del campo ∂B/∂t
// - La presencia (presence) determina el "brillo" del sonido → longitud de onda λ

import { FieldParams, defaultFieldParams } from "@/store/types/field.types";
import { AudioBands } from "@/store/types/audio.types";

// Configuración del mapeo audio → campo.
// Permite ajustar la sensibilidad y rango de cada parámetro sin cambiar la lógica.
export interface AudioMappingConfig {
  // Sensibilidad de cada banda. Multiplica la energía antes del mapeo.
  // Útil para compensar géneros musicales con diferente balance espectral.
  bassGain: number;
  midGain: number;
  highGain: number;
  subGain: number;
  presenceGain: number;

  // Suavizado temporal de los parámetros entre frames, entre 0 y 1.
  // Evita cambios bruscos en el campo que producirían parpadeos visuales.
  // param(t) = smoothing · param(t-1) + (1 - smoothing) · newValue
  smoothing: number;
}

// Configuración por defecto del mapeo
export const defaultAudioMappingConfig: AudioMappingConfig = {
  bassGain: 1.2,
  midGain: 1.0,
  highGain: 0.9,
  subGain: 1.5,
  presenceGain: 0.8,
  smoothing: 0.7,
};

// Aplica suavizado temporal (low-pass de primer orden) entre el valor anterior y el nuevo.
// Equivalente a un filtro IIR de primer orden: y(t) = α·y(t-1) + (1-α)·x(t)
// donde α es el factor de suavizado y x(t) es el valor actual.
function smooth(previous: number, current: number, factor: number): number {
  return factor * previous + (1 - factor) * current;
}

// Limita un valor al rango [0, 1]
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Mapea las bandas de energía de audio a parámetros del campo electromagnético.
//
// Asignaciones:
//
// rho (ρ) ← bass
//   La energía de bajos representa la masa de carga en el campo.
//   Los graves son la "materia" sonora — golpes de bombo, bajos de bajo.
//   Una señal con mucho bass produce un campo denso con fuentes intensas.
//
// J ← mid
//   La densidad de corriente es el movimiento de cargas.
//   Los medios contienen la mayor parte de la energía cinética del sonido.
//   Un mid alto produce partículas más veloces y líneas de campo más dinámicas.
//
// dBdt (∂B/∂t) ← high
//   La variación temporal del campo magnético induce curvatura en el campo eléctrico.
//   Los agudos cambian rápidamente en el tiempo, igual que ∂B/∂t.
//   Un high alto produce líneas de campo más curvadas y partículas con más rotación.
//
// epsilon (ε₀) ← presencia (invertida)
//   La permitividad del vacío controla qué tan fácil es "polarizar" el campo.
//   La presencia alta (sonido brillante) corresponde a un campo más "rígido" (ε bajo).
//   La presencia baja (sonido oscuro) permite mayor deformación del campo (ε alto).
//
// mu (μ₀) ← sub
//   La permeabilidad magnética controla la propagación de perturbaciones.
//   Los sub-graves son lentos y profundos — igual que los cambios de permeabilidad.
//   Un sub alto hace que las perturbaciones se propaguen más lentamente y con más peso.
//
// omega (ω) ← centroide espectral aproximado (mid + high)
//   La frecuencia angular de oscilación del campo corresponde al "brillo" del sonido.
//   Se aproxima usando la combinación de medios y agudos.
//
// lambda (λ) ← invertido de omega
//   La longitud de onda es inversamente proporcional a la frecuencia: λ = c/f = 2πc/ω
//   Un omega alto (sonido brillante) produce lambda corta (ondas juntas).
//   Un omega bajo (sonido oscuro) produce lambda larga (ondas espaciadas).
//
// k ← derivado de lambda
//   El número de onda k = 2π/λ determina la frecuencia espacial de los patrones.
export function audioBandsToFieldParams(
  bands: AudioBands,
  previousParams: FieldParams,
  config: AudioMappingConfig
): FieldParams {
  const s = config.smoothing;

  // Valores crudos con ganancia aplicada, recortados a [0,1]
  const rawRho     = clamp01(bands.bass     * config.bassGain);
  const rawJ       = clamp01(bands.mid      * config.midGain);
  const rawDBdt    = clamp01(bands.high     * config.highGain);
  const rawEpsilon = clamp01(1 - bands.presence * config.presenceGain);
  const rawMu      = clamp01(bands.sub      * config.subGain);
  const rawOmega   = clamp01((bands.mid * 0.4 + bands.high * 0.6) * config.midGain);

  // Lambda es inversamente proporcional a omega: si ω → 1, λ → 0 y viceversa
  const rawLambda = 1 - rawOmega;

  // k = 2π/λ normalizado. Cuando lambda tiende a 0, k satura en 1.
  const rawK = rawLambda > 0.01 ? clamp01((Math.PI * 2) / (rawLambda * 10 + 0.1) / 10) : 1;

  // Magnitud del campo eléctrico E derivada de rho y epsilon
  // Análogo a |E| = ρ / ε₀ de la ley de Gauss
  const rawEMagnitude = clamp01(rawRho / (rawEpsilon + 0.1));

  return {
    rho:         smooth(previousParams.rho,         rawRho,         s),
    J:           smooth(previousParams.J,           rawJ,           s),
    dBdt:        smooth(previousParams.dBdt,        rawDBdt,        s),
    epsilon:     smooth(previousParams.epsilon,     rawEpsilon,     s),
    mu:          smooth(previousParams.mu,          rawMu,          s),
    omega:       smooth(previousParams.omega,       rawOmega,       s),
    lambda:      smooth(previousParams.lambda,      rawLambda,      s),
    k:           smooth(previousParams.k,           rawK,           s),
    E_magnitude: smooth(previousParams.E_magnitude, rawEMagnitude,  s),
  };
}

// Mapea los parámetros del campo a un número de fuentes y sus cargas.
// Genera posiciones de fuentes derivadas del espectro para el modo audio.
//
// La cantidad de fuentes activas escala con rho: más densidad de carga
// implica más fuentes puntuales en el campo, como en una distribución de cargas real.
export function fieldParamsToSourceCount(params: FieldParams): number {
  // Entre 1 y 6 fuentes según la densidad de carga
  return Math.max(1, Math.round(params.rho * 6));
}

// Genera posiciones de fuentes distribuidas según la energía del campo.
// Las fuentes se distribuyen en una elipse cuyo radio escala con E_magnitude.
// No es física real — es una heurística visual coherente con el concepto.
export function generateAudioSourcePositions(
  count: number,
  params: FieldParams,
  time: number
): Array<{ x: number; y: number; charge: number }> {
  const sources = [];
  const radius = 0.1 + params.E_magnitude * 0.2;

  for (let i = 0; i < count; i++) {
    // Ángulo base uniforme más una perturbación derivada de omega y tiempo
    const baseAngle = (i / count) * Math.PI * 2;
    const perturbation = params.omega * Math.sin(time * params.omega * 0.1 + i);
    const angle = baseAngle + perturbation;

    // Alternancia de cargas: fuentes pares positivas, impares negativas
    const charge = i % 2 === 0 ? 1 : -1;

    sources.push({
      x: 0.5 + Math.cos(angle) * radius,
      y: 0.5 + Math.sin(angle) * radius,
      charge,
    });
  }

  return sources;
}

// Aplica un pulso de beat al campo: incrementa transitoriamente E_magnitude y rho.
// Se llama una vez cuando beatDetected es verdadero.
// El efecto decae naturalmente en los frames siguientes por el suavizado del mapeo.
export function applyBeatPulse(params: FieldParams, intensity: number): FieldParams {
  return {
    ...params,
    E_magnitude: clamp01(params.E_magnitude + intensity * 0.4),
    rho:         clamp01(params.rho         + intensity * 0.3),
    omega:       clamp01(params.omega       + intensity * 0.2),
  };
}

// Interpola suavemente los parámetros del campo hacia el estado de reposo.
// Usado cuando no hay audio activo o al cambiar de modo.
// factor: velocidad de retorno, típicamente 0.02 - 0.05 por frame.
export function returnToRest(params: FieldParams, factor: number = 0.03): FieldParams {
  return {
    rho:         smooth(params.rho,         defaultFieldParams.rho,         1 - factor),
    J:           smooth(params.J,           defaultFieldParams.J,           1 - factor),
    dBdt:        smooth(params.dBdt,        defaultFieldParams.dBdt,        1 - factor),
    epsilon:     smooth(params.epsilon,     defaultFieldParams.epsilon,     1 - factor),
    mu:          smooth(params.mu,          defaultFieldParams.mu,          1 - factor),
    omega:       smooth(params.omega,       defaultFieldParams.omega,       1 - factor),
    lambda:      smooth(params.lambda,      defaultFieldParams.lambda,      1 - factor),
    k:           smooth(params.k,           defaultFieldParams.k,           1 - factor),
    E_magnitude: smooth(params.E_magnitude, defaultFieldParams.E_magnitude, 1 - factor),
  };
}