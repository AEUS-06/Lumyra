'use client';

// Hook que lee del store a una frecuencia limitada, en vez de re-renderizar
// en cada cambio (que en el caso de fieldParams ocurre ~60 veces por
// segundo, una vez por frame de audio).
//
// Responsabilidad única: desacoplar la frecuencia de actualización visual
// de la frecuencia real del dato subyacente. Componentes que se ven bien
// actualizándose 15 veces por segundo no necesitan re-renderizarse 60 —
// hacerlo de todas formas es la causa más común de "jank" percibido en
// paneles con muchos elementos: el navegador reflow/repinta más de lo
// que el ojo puede notar, y eso sí se siente como trabado.
//
// Se suscribe directamente al store con subscribe() (fuera del ciclo de
// selectores de React) y solo confirma el valor a React cada intervalMs.

import { useEffect, useRef, useState } from 'react';
import { useLumyraStore, LumyraStore } from '@/store';

export function useThrottledStoreValue<T>(
  selector: (state: LumyraStore) => T,
  intervalMs: number = 66 // ~15 actualizaciones por segundo — fluido para el ojo, ligero para React
): T {
  const [value, setValue] = useState<T>(() => selector(useLumyraStore.getState()));
  const latestRef = useRef(value);

  useEffect(() => {
    latestRef.current = selector(useLumyraStore.getState());

    const unsubscribe = useLumyraStore.subscribe((state) => {
      latestRef.current = selector(state);
    });

    const id = setInterval(() => {
      setValue(latestRef.current);
    }, intervalMs);

    return () => {
      unsubscribe();
      clearInterval(id);
    };
  }, [selector, intervalMs]);

  return value;
}