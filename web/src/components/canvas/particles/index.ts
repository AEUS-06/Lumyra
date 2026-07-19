// Punto de entrada del dominio particles.
// FieldCanvas.tsx importa únicamente desde aquí — nunca desde
// particles/simulation/ o particles/render/ directamente.
//
// Este archivo es el compositor: decide qué tipos y funciones
// de cada submódulo forman la API pública del dominio.

export type { FlowParticle, DustParticle } from './simulation';

export {
  spawnFlowParticles,
  updateFlowParticles,
} from './simulation';

export {
  spawnDustParticles,
  updateDustParticles,
} from './simulation';

export {
  drawFlowParticles,
  drawPhysicsParticles,
  drawDust,
} from './render';