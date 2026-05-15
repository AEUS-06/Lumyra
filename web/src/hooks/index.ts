// Punto de entrada global de todos los hooks de Lumyra.
// Los componentes importan desde aquí, nunca desde subdirectorios directamente.
//
// Uso correcto:
//   import { useAudioEngine } from '@/hooks'
//   import { useHandEngine }  from '@/hooks'
//   import { useFieldEngine } from '@/hooks'
//
// Uso incorrecto:
//   import { useAudioEngine } from '@/hooks/audio/useAudioEngine'

export { useAudioEngine } from './audio';
export type { AudioEngineHandle } from './audio';

export { useHandEngine } from './hands';
export type { HandEngineHandle } from './hands';

export { useFieldEngine } from './field';
export type { FieldEngineHandle } from './field';