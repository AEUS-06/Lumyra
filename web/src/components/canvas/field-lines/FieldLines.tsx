'use client';

// Componente que renderiza las líneas de campo electromagnético.
//
// Responsabilidad única: declarar el mesh de líneas y actualizar
// la geometría en cada frame de R3F via useFrame.
//
// No calcula geometría ni física — delega en useFieldLinesUpdate.
// No lee del store directamente — recibe los datos como props
// para que FieldCanvas controle qué datos fluyen hacia aquí.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fieldVertexShader, fieldFragmentShader } from '../shaders';
import { useFieldLinesUpdate } from './useFieldLinesUpdate';
import { FieldSource, FieldParams } from '@/store/types/field.types';

interface FieldLinesProps {
  sources:     FieldSource[];
  fieldParams: FieldParams;
  beatPulse:   number;
  isMobile:    boolean;
}

export function FieldLines({ sources, fieldParams, beatPulse, isMobile }: FieldLinesProps) {
  const { geometry, update } = useFieldLinesUpdate();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame(({ clock }) => {
    // Actualizar la geometría con las fuentes y parámetros del frame actual
    update(sources, fieldParams, isMobile);

    // Actualizar los uniforms del shader
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value      = clock.getElapsedTime();
      materialRef.current.uniforms.uBeatPulse.value = beatPulse;
    }
  });

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={fieldVertexShader}
        fragmentShader={fieldFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uAlpha:     { value: 0.8 },
          uBeatPulse: { value: 0.0 },
          uTime:      { value: 0.0 },
        }}
      />
    </lineSegments>
  );
}