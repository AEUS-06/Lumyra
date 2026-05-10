// Tipos relacionados al análisis y síntesis de audio.
// El sistema de audio traduce señales sonoras en parámetros electromagnéticos
// mediante análisis espectral con la Transformada Rápida de Fourier (FFT).

// Datos de un frame de audio procesado.
// Se actualiza en cada tick del AnalyserNode de la Web Audio API (aproximadamente cada 16ms a 60fps).
export interface AudioFrame {
  // waveform: muestras de la señal de audio en el dominio del tiempo.
  // Valores normalizados entre -1 y 1. Longitud determinada por fftSize del AnalyserNode.
  // Representa la onda de presión sonora en el instante actual.
  waveform: Float32Array;

  // frequencyData: magnitudes del espectro de frecuencias en decibelios.
  // Resultado de aplicar la FFT a la señal de tiempo: X(f) = FFT{x(t)}
  // Longitud = fftSize / 2. Cada bin representa un rango de frecuencias: Δf = sampleRate / fftSize
  frequencyData: Float32Array;

  // Energía RMS del frame actual: E_rms = √(1/N · Σxᵢ²)
  // Representa el nivel de energía promedio de la señal en este instante.
  // Usado para detección de transientes comparando contra un promedio móvil.
  rms: number;

  // Bandas de energía extraídas del espectro FFT.
  // Cada banda agrupa bins de frecuencia y promedia sus magnitudes normalizadas entre 0 y 1.
  bands: AudioBands;

  // Marca de tiempo del frame en milisegundos desde que inició la reproducción
  timestamp: number;
}

// Bandas de frecuencia del espectro de audio.
// Cada banda mapea a un parámetro electromagnético distinto en el campo.
export interface AudioBands {
  // sub: energía en frecuencias sub-graves (20Hz - 60Hz).
  // En Lumyra: modula mu (μ₀), permeabilidad del vacío. Las frecuencias más bajas afectan la propagación.
  sub: number;

  // bass: energía en frecuencias de graves (60Hz - 250Hz).
  // En Lumyra: modula rho (ρ), densidad de carga. Los bajos determinan la intensidad de las fuentes.
  bass: number;

  // mid: energía en frecuencias medias (250Hz - 2000Hz).
  // En Lumyra: modula J, densidad de corriente. Los medios controlan el movimiento de partículas.
  mid: number;

  // high: energía en frecuencias agudas (2000Hz - 8000Hz).
  // En Lumyra: modula dBdt (∂B/∂t), variación del campo magnético. Los agudos generan modulación.
  high: number;

  // presence: energía en frecuencias de presencia (8000Hz - 20000Hz).
  // En Lumyra: modula omega (ω), frecuencia angular. Las frecuencias más altas aceleran la oscilación.
  presence: number;
}

// Estado completo del sistema de audio en el store
export interface AudioState {
  // Indica si hay un archivo de audio cargado y el AudioContext está activo
  audioReady: boolean;

  // Indica si el audio está reproduciéndose en este momento
  audioPlaying: boolean;

  // Nombre del archivo de audio cargado, para mostrar en la UI
  audioFileName: string | null;

  // Duración total del archivo en segundos
  audioDuration: number;

  // Posición actual de reproducción en segundos
  audioCurrentTime: number;

  // beatDetected: verdadero durante exactamente un frame cuando se detecta un transiente.
  // La detección compara la energía RMS actual contra un promedio móvil de los últimos N frames:
  // beat = E_rms(t) > umbral · media(E_rms(t-N .. t-1))
  // Usado para disparar efectos de pulso radial en el canvas.
  beatDetected: boolean;

  // Datos del frame de audio procesado más reciente
  audioFrame: AudioFrame | null;

  // Acciones del slice
  setAudioReady: (ready: boolean) => void;
  setAudioPlaying: (playing: boolean) => void;
  setAudioFileName: (name: string | null) => void;
  setAudioDuration: (duration: number) => void;
  setAudioCurrentTime: (time: number) => void;
  setBeatDetected: (detected: boolean) => void;
  setAudioFrame: (frame: AudioFrame) => void;
  resetAudio: () => void;
}