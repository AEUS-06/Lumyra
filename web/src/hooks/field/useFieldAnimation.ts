'use client';

// Hook responsable del loop de animación del campo electromagnético.
//
// En cada frame de animación este hook:
// 1. Lee fieldParams y fieldSources del store
// 2. Actualiza el sistema de partículas aplicando la fuerza de Lorentz
// 3. Escribe las partículas actualizadas al store para que el canvas las dibuje
//
// El loop usa requestAnimationFrame para sincronizarse con el ciclo de
// renderizado del browser, garantizando 60fps sin bloquear el hilo principal.
//
// Responsabilidad única: mantener el sistema de partículas actualizado por frame.
// Este hook no genera fuentes ni dibuja — solo actualiza el estado de las partículas.

import { useEffect, useRef, useCallback } from 'react';
import {
  createParticleSystem,
  updateParticleSystem,
  defaultParticleConfig,
  mobileParticleConfig,
  Particle,
} from '@/lib';
import { useLumyraStore } from '@/store';

// Estado de las partículas expuesto al canvas.
// Se mantiene en una ref para evitar re-renders de React en cada frame —
// el canvas lee directamente de la ref en su propio loop de renderizado.
export interface FieldAnimationHandle {
  // Ref al array de partículas actualizado en cada frame.
  // El canvas de R3F lee este valor en su useFrame loop.
  particlesRef: React.MutableRefObject<Particle[]>;
}

// Hook que gestiona el loop de animación de partículas del campo.
export function useFieldAnimation(): FieldAnimationHandle {
  const fieldParams   = useLumyraStore((s) => s.fieldParams);
  const fieldSources  = useLumyraStore((s) => s.fieldSources);
  const isMobile      = useLumyraStore((s) => s.config.isMobile);

  // Las partículas viven en una ref, no en estado de React.
  // Esto evita que cada actualización de partículas (60 veces por segundo)
  // dispare un re-render del árbol de componentes de React.
  // El canvas de R3F accede a la ref directamente en su loop de renderizado.
  const particlesRef  = useRef<Particle[]>([]);
  const animFrameRef  = useRef<number | null>(null);

  // Inicializar el sistema de partículas con la configuración correcta según el dispositivo
  useEffect(() => {
    const config = isMobile ? mobileParticleConfig : defaultParticleConfig;
    particlesRef.current = createParticleSystem(config);
  }, [isMobile]);

  // Loop de animación: actualiza las partículas en cada frame
  const tick = useCallback(() => {
    const config = isMobile ? mobileParticleConfig : defaultParticleConfig;

    // Actualizar todas las partículas aplicando la fuerza de Lorentz eléctrica:
    // F = q · E(x,y), donde E se calcula por superposición de las fuentes activas.
    // Las partículas agotadas se reinician en posición aleatoria.
    particlesRef.current = updateParticleSystem(
      particlesRef.current,
      fieldSources,
      fieldParams,
      config
    );

    animFrameRef.current = requestAnimationFrame(tick);
  }, [fieldSources, fieldParams, isMobile]);

  // Iniciar y limpiar el loop de animación
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [tick]);

  return { particlesRef };
}