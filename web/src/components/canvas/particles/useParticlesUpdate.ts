'use client';

// Hook que orquesta la actualización de la geometría de partículas en cada frame.
//
// Responsabilidad única: en cada frame de R3F, convertir el array de partículas
// de la ref (actualizado por useFieldAnimation) a buffers de geometría
// y marcar los BufferAttributes como needsUpdate.
//
// Los buffers se pre-alocan una sola vez para evitar garbage collection.

import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Particle } from '@/lib';
import { particlesToPositions } from './particlesToPositions';
import { particlesToIntensities } from './particlesToColors';

const MAX_PARTICLES = 120;

export interface ParticleGeometry {
  geometry:  THREE.BufferGeometry;
  update:    (particles: Particle[]) => void;
}

// Hook que crea y gestiona la geometría del sistema de partículas.
export function useParticlesUpdate(): ParticleGeometry {
  const geometryRef    = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const positionsRef   = useRef<Float32Array>(new Float32Array(MAX_PARTICLES * 3));
  const intensitiesRef = useRef<Float32Array>(new Float32Array(MAX_PARTICLES));

  // Inicializar los BufferAttributes
  const posAttr = new THREE.BufferAttribute(positionsRef.current, 3);
  const intAttr = new THREE.BufferAttribute(intensitiesRef.current, 1);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  intAttr.setUsage(THREE.DynamicDrawUsage);
  geometryRef.current.setAttribute('position',   posAttr);
  geometryRef.current.setAttribute('aIntensity', intAttr);

  // Actualiza la geometría con el estado actual del array de partículas
  const update = useCallback((particles: Particle[]): void => {
    if (particles.length === 0) {
      geometryRef.current.setDrawRange(0, 0);
      return;
    }

    // Escribir en los buffers pre-alocados
    particlesToPositions(particles, positionsRef.current);
    particlesToIntensities(particles, intensitiesRef.current);

    const posAttribute = geometryRef.current.getAttribute('position') as THREE.BufferAttribute;
    const intAttribute = geometryRef.current.getAttribute('aIntensity') as THREE.BufferAttribute;
    posAttribute.needsUpdate = true;
    intAttribute.needsUpdate = true;

    geometryRef.current.setDrawRange(0, particles.length);
  }, []);

  return { geometry: geometryRef.current, update };
}