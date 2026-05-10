// Análisis espectral de señales de audio mediante la Transformada de Fourier.
//
// La Transformada Rápida de Fourier (FFT) convierte una señal del dominio del tiempo
// al dominio de la frecuencia, revelando qué frecuencias componen la señal:
//
// X(f) = Σₙ x(n) · e^(-j2πfn/N)
//
// La Web Audio API expone el resultado a través de AnalyserNode, que mantiene
// un buffer circular de la señal y calcula la FFT en tiempo real.
// El resultado son N/2 bins de frecuencia, donde cada bin representa
// un rango de frecuencias de ancho: Δf = sampleRate / fftSize
//
// Para una sampleRate de 44100 Hz y fftSize de 2048:
// Δf = 44100 / 2048 ≈ 21.5 Hz por bin
// Total de bins: 1024 (de 0 Hz a 22050 Hz)

import { AudioBands } from "@/store/types/audio.types";

// Configuración del analizador FFT.
// Estos valores deben coincidir con los usados al crear el AnalyserNode
// en el hook useAudioAnalyzer.ts.
export interface FFTConfig {
  // Número de muestras por frame de FFT. Debe ser potencia de 2.
  // Valores más altos dan mejor resolución en frecuencia pero peor en tiempo.
  // fftSize: 2048 da resolución de ~21Hz por bin a 44100Hz — suficiente para Lumyra.
  fftSize: number;

  // Frecuencia de muestreo del AudioContext en Hz.
  // Generalmente 44100 Hz o 48000 Hz según el dispositivo.
  sampleRate: number;

  // Suavizado temporal del espectro entre frames, entre 0 y 1.
  // 0 = sin suavizado (cambios abruptos), 1 = suavizado infinito (sin cambios).
  // El AnalyserNode aplica: X_smooth(t) = smoothing · X(t-1) + (1-smoothing) · X(t)
  smoothingTimeConstant: number;

  // Valor mínimo del espectro en decibelios. Bins por debajo de este valor se recortan a 0.
  minDecibels: number;

  // Valor máximo del espectro en decibelios. Determina el rango dinámico de la visualización.
  maxDecibels: number;
}

// Configuración por defecto del analizador
export const defaultFFTConfig: FFTConfig = {
  fftSize: 2048,
  sampleRate: 44100,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
};

// Límites de frecuencia para cada banda espectral en Hz.
// Basados en la percepción psicoacústica estándar y en cómo cada rango
// de frecuencias contribuye al carácter tímbrico de la música.
export interface BandDefinitions {
  sub:      [number, number]; // Sub-graves: 20Hz - 60Hz
  bass:     [number, number]; // Graves: 60Hz - 250Hz
  mid:      [number, number]; // Medios: 250Hz - 2000Hz
  high:     [number, number]; // Agudos: 2000Hz - 8000Hz
  presence: [number, number]; // Presencia: 8000Hz - 20000Hz
}

// Definición estándar de bandas usada en toda la aplicación
export const BAND_DEFINITIONS: BandDefinitions = {
  sub:      [20,   60],
  bass:     [60,   250],
  mid:      [250,  2000],
  high:     [2000, 8000],
  presence: [8000, 20000],
};

// Convierte una frecuencia en Hz al índice de bin FFT correspondiente.
// bin = round(frequency · fftSize / sampleRate)
// El índice máximo es fftSize/2 - 1 (teorema de Nyquist).
export function frequencyToBin(frequency: number, config: FFTConfig): number {
  const bin = Math.round((frequency * config.fftSize) / config.sampleRate);
  return Math.min(bin, config.fftSize / 2 - 1);
}

// Calcula la energía promedio de un rango de bins del buffer FFT.
// Los valores del buffer están en el rango [0, 255] (uint8) donde:
// 0 = minDecibels, 255 = maxDecibels
// Se normaliza a [0, 1] dividiendo entre 255.
export function getBandEnergy(
  frequencyData: Uint8Array,
  minFreq: number,
  maxFreq: number,
  config: FFTConfig
): number {
  const minBin = frequencyToBin(minFreq, config);
  const maxBin = frequencyToBin(maxFreq, config);

  if (minBin >= maxBin) return 0;

  let sum = 0;
  for (let i = minBin; i <= maxBin; i++) {
    sum += frequencyData[i];
  }

  return sum / ((maxBin - minBin + 1) * 255);
}

// Extrae las energías de todas las bandas espectrales desde un buffer FFT.
// Retorna valores normalizados en [0, 1] para cada banda.
// Esta función es llamada en cada frame de audio por useAudioAnalyzer.ts.
export function extractBands(
  frequencyData: Uint8Array,
  config: FFTConfig
): AudioBands {
  return {
    sub:      getBandEnergy(frequencyData, ...BAND_DEFINITIONS.sub,      config),
    bass:     getBandEnergy(frequencyData, ...BAND_DEFINITIONS.bass,     config),
    mid:      getBandEnergy(frequencyData, ...BAND_DEFINITIONS.mid,      config),
    high:     getBandEnergy(frequencyData, ...BAND_DEFINITIONS.high,     config),
    presence: getBandEnergy(frequencyData, ...BAND_DEFINITIONS.presence, config),
  };
}

// Calcula la energía RMS (Root Mean Square) de la señal de audio en el dominio del tiempo.
// E_rms = √(1/N · Σ x²ᵢ)
//
// El RMS representa el nivel de energía promedio de la señal, equivalente
// a la amplitud cuadrática media. Es más representativo del volumen percibido
// que el valor de pico porque integra la energía en el tiempo.
//
// Se usa para detección de beats comparando el RMS actual
// contra un promedio móvil de frames anteriores.
export function calculateRMS(waveformData: Float32Array): number {
  if (waveformData.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < waveformData.length; i++) {
    sum += waveformData[i] * waveformData[i];
  }

  return Math.sqrt(sum / waveformData.length);
}

// Calcula el centroide espectral del buffer FFT.
// El centroide espectral es el "centro de masa" del espectro de frecuencias:
// C = Σ(f · X(f)) / Σ(X(f))
//
// Valores bajos indican un sonido oscuro (predominan graves).
// Valores altos indican un sonido brillante (predominan agudos).
// Retorna la frecuencia del centroide en Hz, normalizada a [0, 1]
// dividiendo por la frecuencia de Nyquist (sampleRate / 2).
export function spectralCentroid(
  frequencyData: Uint8Array,
  config: FFTConfig
): number {
  const nyquist = config.sampleRate / 2;
  let weightedSum = 0;
  let totalMagnitude = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = (i / frequencyData.length) * nyquist;
    const magnitude = frequencyData[i] / 255;
    weightedSum += frequency * magnitude;
    totalMagnitude += magnitude;
  }

  if (totalMagnitude < 1e-6) return 0;

  return (weightedSum / totalMagnitude) / nyquist;
}