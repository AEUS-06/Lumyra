// Punto de entrada de los hooks de audio.
// Los componentes importan únicamente useAudioEngine desde aquí.
// Los hooks internos son detalles de implementación no exportados públicamente.

export { useAudioEngine } from './useAudioEngine';
export type { AudioEngineHandle } from './useAudioEngine';