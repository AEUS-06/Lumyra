'use client';

// Hook público del sistema de campo electromagnético de Lumyra.
// Compone useFieldSources y useFieldAnimation en una interfaz
// única que el canvas consume.
//
// Este es el único hook de campo que los componentes importan directamente.
// Los hooks internos son detalles de implementación encapsulados aquí.
//
// Responsabilidad única: componer el sistema de campo y exponer
// los datos que el canvas necesita para renderizar en cada frame.

import { useFieldSources } from './useFieldSources';
import { useFieldAnimation } from './useFieldAnimation';
import { Particle } from '@/lib';

// Interfaz pública que el canvas consume
export interface FieldEngineHandle {
  // Ref al array de partículas actualizado en cada frame del loop de animación.
  // FieldCanvas.tsx lee este valor en su useFrame de R3F.
  particlesRef: React.MutableRefObject<Particle[]>;
}

// Hook público del motor de campo electromagnético.
export function useFieldEngine(): FieldEngineHandle {
  // useFieldSources no retorna nada — escribe directamente al store.
  // Su efecto es que fieldSources en el store siempre refleja el estado actual.
  useFieldSources();

  // useFieldAnimation lee del store y mantiene las partículas actualizadas.
  const { particlesRef } = useFieldAnimation();

  return { particlesRef };
}