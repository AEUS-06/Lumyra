// Detección de transientes y beats en señales de audio.
//
// Un transiente es un incremento súbito de energía en la señal de audio.
// En música corresponde a los ataques de instrumentos percusivos, golpes de
// bombo, snare, y cualquier evento con onset rápido.
//
// El algoritmo de detección compara la energía RMS del frame actual
// contra un promedio móvil de frames anteriores (historia de energía):
//
// beat = E_rms(t) > umbral · media(E_rms(t-N .. t-1))
//
// Este método se llama "onset detection" o "flux spectral" en su variante
// más sofisticada. La versión implementada aquí usa energía de banda completa
// (broadband energy) que es suficiente para música con percusión prominente.
//
// Referencia: Bello et al. "A Tutorial on Onset Detection in Music Signals" (2005)

import { calculateRMS } from "./fft";

// Configuración del detector de transientes.
// Los parámetros permiten ajustar la sensibilidad según el género musical.
export interface BeatDetectorConfig {
  // Número de frames en la historia de energía para el promedio móvil.
  // Un valor mayor hace el detector más lento para adaptarse a cambios de volumen.
  // Un valor menor lo hace más sensible pero también más propenso a falsos positivos.
  // A 60fps, historySize=43 corresponde aproximadamente a 700ms de historia.
  historySize: number;

  // Factor multiplicador sobre el promedio histórico para declarar un beat.
  // beat = E_rms(t) > threshold · media(historia)
  // Valores típicos: 1.3 (sensible) a 1.8 (conservador).
  threshold: number;

  // Número mínimo de frames entre beats consecutivos.
  // Evita que un solo transiente genere múltiples beats seguidos.
  // A 60fps, cooldown=20 equivale a ~333ms, un límite de ~180 BPM.
  cooldown: number;

  // Energía mínima absoluta para considerar un beat.
  // Evita detecciones en silencio o señales muy débiles.
  minEnergy: number;
}

// Configuración por defecto del detector
export const defaultBeatDetectorConfig: BeatDetectorConfig = {
  historySize: 43,
  threshold: 1.4,
  cooldown: 20,
  minEnergy: 0.015,
};

// Estado interno del detector de beats.
// Se mantiene entre frames en el hook useAudioAnalyzer.ts.
// Es inmutable — cada llamada a detectBeat retorna un nuevo estado.
export interface BeatDetectorState {
  // Buffer circular con los últimos historySize valores de energía RMS
  energyHistory: number[];

  // Frames restantes de cooldown tras el último beat detectado
  cooldownFrames: number;

  // Energía RMS del frame anterior, para calcular el flux de energía
  previousEnergy: number;

  // Número total de beats detectados desde que inició la reproducción
  beatCount: number;
}

// Estado inicial del detector
export const initialBeatDetectorState: BeatDetectorState = {
  energyHistory: [],
  cooldownFrames: 0,
  previousEnergy: 0,
  beatCount: 0,
};

// Resultado de evaluar un frame de audio con el detector
export interface BeatDetectionResult {
  // Verdadero si se detectó un transiente en este frame
  isBeat: boolean;

  // Energía RMS del frame actual, para uso en el store y visualización
  currentEnergy: number;

  // Promedio de energía histórica. Útil para normalizar otros parámetros.
  averageEnergy: number;

  // Ratio entre energía actual y promedio histórico.
  // energyRatio > threshold indica un beat. Siempre >= 0.
  energyRatio: number;

  // Estado actualizado del detector para el siguiente frame
  nextState: BeatDetectorState;
}

// Evalúa un frame de audio y determina si contiene un transiente.
//
// El algoritmo en detalle:
// 1. Calcular E_rms del frame actual desde el buffer de waveform
// 2. Si hay cooldown activo, decrementar y no detectar
// 3. Calcular el promedio móvil de la historia de energía
// 4. Si E_rms(t) > threshold · promedio y E_rms > minEnergy → beat
// 5. Actualizar la historia con el valor actual (buffer circular)
// 6. Retornar resultado y estado actualizado
export function detectBeat(
  waveformData: Float32Array,
  state: BeatDetectorState,
  config: BeatDetectorConfig
): BeatDetectionResult {
  const currentEnergy = calculateRMS(waveformData);

  // Calcular promedio de la historia de energía
  const averageEnergy =
    state.energyHistory.length > 0
      ? state.energyHistory.reduce((a, b) => a + b, 0) / state.energyHistory.length
      : currentEnergy;

  const energyRatio = averageEnergy > 1e-6 ? currentEnergy / averageEnergy : 0;

  // Cooldown activo — no detectar aunque haya un transiente
  if (state.cooldownFrames > 0) {
    const nextHistory = [...state.energyHistory, currentEnergy].slice(-config.historySize);
    return {
      isBeat: false,
      currentEnergy,
      averageEnergy,
      energyRatio,
      nextState: {
        energyHistory: nextHistory,
        cooldownFrames: state.cooldownFrames - 1,
        previousEnergy: currentEnergy,
        beatCount: state.beatCount,
      },
    };
  }

  // Evaluación de la condición de beat
  const isBeat =
    currentEnergy > config.threshold * averageEnergy &&
    currentEnergy > config.minEnergy;

  // Actualizar historia de energía como buffer circular
  const nextHistory = [...state.energyHistory, currentEnergy].slice(-config.historySize);

  const nextState: BeatDetectorState = {
    energyHistory: nextHistory,
    cooldownFrames: isBeat ? config.cooldown : 0,
    previousEnergy: currentEnergy,
    beatCount: state.beatCount + (isBeat ? 1 : 0),
  };

  return {
    isBeat,
    currentEnergy,
    averageEnergy,
    energyRatio,
    nextState,
  };
}

// Estima el tempo aproximado en BPM a partir del intervalo entre beats recientes.
// No es un estimador de tempo preciso — es una aproximación visual
// para sincronizar efectos del campo con el ritmo percibido.
//
// Se necesita mantener externamente un historial de timestamps de beats.
// Retorna null si no hay suficientes beats para estimar.
export function estimateTempo(beatTimestamps: number[]): number | null {
  if (beatTimestamps.length < 4) return null;

  // Calcular intervalos entre beats consecutivos en milisegundos
  const intervals: number[] = [];
  for (let i = 1; i < beatTimestamps.length; i++) {
    intervals.push(beatTimestamps[i] - beatTimestamps[i - 1]);
  }

  // Promedio de intervalos
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  if (avgInterval < 1) return null;

  // Convertir de ms/beat a BPM: BPM = 60000 / ms_por_beat
  const bpm = 60000 / avgInterval;

  // Rango razonable de tempo musical: 40 BPM a 240 BPM
  if (bpm < 40 || bpm > 240) return null;

  return Math.round(bpm);
}