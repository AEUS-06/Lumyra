'use client';

// Hook que orquesta la actualización de la geometría de líneas de campo en cada frame.
//
// Responsabilidad única: en cada frame de R3F, generar las líneas de campo
// desde las fuentes activas y actualizar los BufferAttributes de la geometría.
//
// Llama a generateFieldLines de lib/field para trazar las líneas,
// luego convierte el resultado a buffers usando fieldLinesToBuffers
// y fieldLinesColors, y finalmente marca los attributes como needsUpdate.

import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  generateFieldLines,
  defaultFieldLineConfig,
  mobileFieldLineConfig,
} from '@/lib';
import { FieldSource, FieldParams } from '@/store/types/field.types';
import { fieldLinesToPositions, countLineVertices } from './fieldLinesToBuffers';
import { fieldLinesToIntensities } from './fieldLinesColors';

// Tamaño máximo de los buffers pre-alocados.
// Se sobredimensionan para evitar re-alocaciones frecuentes.
// 16 líneas × 200 pasos × 2 vértices × 3 coords = ~19200 floats máximo
const MAX_VERTICES = 20000;

export interface FieldLinesGeometry {
  // BufferGeometry lista para asignar a un THREE.LineSegments
  geometry: THREE.BufferGeometry;

  // Función llamada en cada useFrame para actualizar la geometría
  update: (sources: FieldSource[], fieldParams: FieldParams, isMobile: boolean) => void;
}

// Hook que crea y gestiona la geometría de líneas de campo.
// Los buffers se pre-alocan una sola vez para evitar garbage collection en el loop.
export function useFieldLinesUpdate(): FieldLinesGeometry {
  const geometryRef   = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const positionsRef  = useRef<Float32Array>(new Float32Array(MAX_VERTICES * 3));
  const intensitiesRef = useRef<Float32Array>(new Float32Array(MAX_VERTICES));

  // Inicializar los BufferAttributes con los buffers pre-alocados
  const posAttr = new THREE.BufferAttribute(positionsRef.current, 3);
  const intAttr = new THREE.BufferAttribute(intensitiesRef.current, 1);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  intAttr.setUsage(THREE.DynamicDrawUsage);
  geometryRef.current.setAttribute('position',   posAttr);
  geometryRef.current.setAttribute('aIntensity', intAttr);

  // Actualiza la geometría con las líneas del frame actual
  const update = useCallback(
    (sources: FieldSource[], fieldParams: FieldParams, isMobile: boolean): void => {
      if (sources.length === 0) {
        geometryRef.current.setDrawRange(0, 0);
        return;
      }

      const config = isMobile ? mobileFieldLineConfig : defaultFieldLineConfig;
      const lines  = generateFieldLines(sources, config);

      if (lines.length === 0) {
        geometryRef.current.setDrawRange(0, 0);
        return;
      }

      const positions  = fieldLinesToPositions(lines);
      const intensities = fieldLinesToIntensities(lines);
      const vertexCount = countLineVertices(lines);

      // Copiar en los buffers pre-alocados en lugar de crear arrays nuevos
      positionsRef.current.set(positions);
      intensitiesRef.current.set(intensities);

      // Marcar los attributes como modificados para que Three.js los suba a la GPU
      const posAttribute = geometryRef.current.getAttribute('position') as THREE.BufferAttribute;
      const intAttribute = geometryRef.current.getAttribute('aIntensity') as THREE.BufferAttribute;
      posAttribute.needsUpdate = true;
      intAttribute.needsUpdate = true;

      // Limitar el draw range al número real de vértices del frame actual
      geometryRef.current.setDrawRange(0, vertexCount);
    },
    []
  );

  return { geometry: geometryRef.current, update };
}