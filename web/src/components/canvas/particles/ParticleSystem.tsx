'use client';

// Componente que renderiza el sistema de partículas cargadas.
//
// Responsabilidad única: declarar el Points mesh y actualizar
// la geometría en cada frame leyendo desde particlesRef.
//
// particlesRef es una ref mutable actualizada por useFieldAnimation
// a 60fps sin disparar re-renders de React — el canvas lee directamente
// la ref en su propio loop de useFrame.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fieldVertexShader, fieldFragmentShader } from '../shaders';
import { useParticlesUpdate } from './useParticlesUpdate';
import { Particle } from '@/lib';

interface ParticleSystemProps {
  particlesRef: React.MutableRefObject<Particle[]>;
  beatPulse:    number;
}

export function ParticleSystem({ particlesRef, beatPulse }: ParticleSystemProps) {
  const { geometry, update } = useParticlesUpdate();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame(({ clock }) => {
    // Leer directamente desde la ref — no causa re-renders de React
    update(particlesRef.current);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value      = clock.getElapsedTime();
      materialRef.current.uniforms.uBeatPulse.value = beatPulse;
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={fieldVertexShader}
        fragmentShader={fieldFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uAlpha:     { value: 0.9 },
          uBeatPulse: { value: 0.0 },
          uTime:      { value: 0.0 },
        }}
      />
    </points>
  );
}