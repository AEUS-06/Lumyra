// Punto de entrada único de toda la librería de Lumyra.
// Los hooks, componentes y cualquier otro módulo importan desde aquí.
//
// La estructura interna de cada dominio (field, audio, hands) es un detalle
// de implementación — este archivo es el contrato público de la lib.
//
// Uso correcto:
//   import { vec2, electricField, extractBands, recognizeGesture } from "@/lib";
//
// Uso incorrecto:
//   import { vec2 } from "@/lib/field/vector2";
//   import { extractBands } from "@/lib/audio/fft";

// Dominio del campo electromagnético.
// Álgebra vectorial, cálculo del campo eléctrico por superposición,
// trazado de líneas de campo e integración numérica, dinámica de partículas.
export * from "./field";

// Dominio del análisis de audio.
// Análisis espectral FFT, extracción de bandas de frecuencia,
// detección de transientes por energía RMS, mapeo AudioBands → FieldParams.
export * from "./audio";

// Dominio del tracking de manos.
// Geometría de landmarks, reconocimiento de gestos,
// mapeo HandData → FieldParams.
export * from "./hands";