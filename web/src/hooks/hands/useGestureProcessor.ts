'use client';

// Hook responsable de procesar los landmarks crudos de MediaPipe
// y traducirlos en gestos reconocidos y parámetros del campo electromagnético.
//
// Recibe los landmarks de useMediaPipe.ts y produce:
// 1. HandData — gestos, parámetros físicos y posición de cada mano
// 2. FieldParams — parámetros del campo derivados de los gestos
//
// Responsabilidad única: traducción de landmarks a datos de dominio.
// Este hook no gestiona MediaPipe ni la cámara — solo interpreta datos.

import { useRef, useCallback } from 'react';
import {
  computeHandPhysicalParams,
  recognizeGesture,
  handDataToFieldParams,
  defaultHandMappingConfig,
} from '@/lib';
import { HandData, LandmarkPoint } from '@/store/types/hands.types';
import { FieldParams } from '@/store/types/field.types';
import { MediaPipeFrameResult } from './useMediaPipe';

// Resultado del procesamiento de un frame de landmarks
export interface GestureProcessorResult {
  // Datos completos de ambas manos con gestos y parámetros físicos
  handData: HandData;

  // Parámetros del campo electromagnético derivados de los gestos
  fieldParams: FieldParams;
}

// Callback invocado en cada frame con el resultado del procesamiento
export type GestureProcessorCallback = (result: GestureProcessorResult) => void;

export interface GestureProcessorHandle {
  // Procesa un frame de resultados de MediaPipe y devuelve HandData y FieldParams.
  // Debe llamarse en cada callback de resultados de useMediaPipe.
  process: (
    mediaPipeResult: MediaPipeFrameResult,
    currentFieldParams: FieldParams
  ) => GestureProcessorResult;
}

// Hook que traduce landmarks de MediaPipe en datos de dominio de Lumyra.
export function useGestureProcessor(): GestureProcessorHandle {
  // Posiciones anteriores de los centroides de cada mano.
  // Necesarias para calcular la velocidad de movimiento entre frames.
  const prevLeftCentroidRef  = useRef<{ x: number; y: number } | null>(null);
  const prevRightCentroidRef = useRef<{ x: number; y: number } | null>(null);

  // Procesa los landmarks de un frame y produce HandData y FieldParams.
  const process = useCallback(
    (
      mediaPipeResult: MediaPipeFrameResult,
      currentFieldParams: FieldParams
    ): GestureProcessorResult => {
      const { leftHandLandmarks, rightHandLandmarks } = mediaPipeResult;

      // Procesar mano izquierda
      let leftHand: HandData['left'] = null;
      if (leftHandLandmarks) {
        const params = computeHandPhysicalParams(
          leftHandLandmarks,
          prevLeftCentroidRef.current
        );
        const gesture = recognizeGesture(leftHandLandmarks);

        // Actualizar posición anterior para el cálculo de velocidad del siguiente frame
        prevLeftCentroidRef.current = params.position;

        leftHand = {
          detected: true,
          landmarks: leftHandLandmarks,
          gesture,
          params,
        };
      } else {
        // Si la mano no se detectó, limpiar la posición anterior
        prevLeftCentroidRef.current = null;
      }

      // Procesar mano derecha
      let rightHand: HandData['right'] = null;
      if (rightHandLandmarks) {
        const params = computeHandPhysicalParams(
          rightHandLandmarks,
          prevRightCentroidRef.current
        );
        const gesture = recognizeGesture(rightHandLandmarks);

        prevRightCentroidRef.current = params.position;

        rightHand = {
          detected: true,
          landmarks: rightHandLandmarks,
          gesture,
          params,
        };
      } else {
        prevRightCentroidRef.current = null;
      }

      // Calcular distancia entre manos si ambas están presentes.
      // Usada para detectar resonancia entre las dos fuentes de campo.
      let handsDistance: number | null = null;
      if (leftHand && rightHand) {
        const dx = leftHand.params.position.x - rightHand.params.position.x;
        const dy = leftHand.params.position.y - rightHand.params.position.y;
        handsDistance = Math.sqrt(dx * dx + dy * dy);
      }

      const handData: HandData = {
        left:          leftHand,
        right:         rightHand,
        handsDistance,
      };

      // Traducir HandData a FieldParams usando la lib de manos
      const fieldParams = handDataToFieldParams(
        handData,
        currentFieldParams,
        defaultHandMappingConfig
      );

      return { handData, fieldParams };
    },
    []
  );

  return { process };
}