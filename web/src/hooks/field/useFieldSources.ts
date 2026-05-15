'use client';

// Hook responsable únicamente de generar la lista de fuentes puntuales
// del campo electromagnético según el modo activo y el estado del store.
//
// Las fuentes (FieldSource[]) son las cargas puntuales cuya superposición
// define el campo eléctrico total en cada punto del espacio de simulación:
// E_total(r) = Σᵢ qᵢ · (r - rᵢ) / |r - rᵢ|²
//
// La lista de fuentes cambia según el modo:
// - Modo audio:  fuentes generadas dinámicamente desde fieldParams y beatDetected
// - Modo manos:  fuentes en las posiciones de gestos pinch y victory
// - Sin entrada: dos fuentes autónomas en reposo (dipolo electromagnético estático)
//
// Responsabilidad única: calcular qué fuentes existen en cada frame.
// Este hook no dibuja ni simula física — solo produce datos para el canvas.

import { useEffect, useRef } from 'react';
import {
  generateAudioSourcePositions,
  fieldParamsToSourceCount,
} from '@/lib';
import { pinchSourcePosition, victorySourcePositions } from '@/lib';
import { useLumyraStore } from '@/store';
import { FieldSource } from '@/store/types/field.types';

// Genera un id único para cada fuente combinando origen y un índice
function makeSourceId(origin: string, index: number): string {
  return `${origin}-${index}`;
}

// Hook que sincroniza las FieldSource[] del store con el estado actual.
// Se ejecuta en cada frame relevante y actualiza el store cuando las fuentes cambian.
export function useFieldSources(): void {
  const mode           = useLumyraStore((s) => s.mode);
  const fieldParams    = useLumyraStore((s) => s.fieldParams);
  const beatDetected   = useLumyraStore((s) => s.beatDetected);
  const handData       = useLumyraStore((s) => s.handData);
  const audioReady     = useLumyraStore((s) => s.audioReady);
  const setFieldSources = useLumyraStore((s) => s.setFieldSources);

  // Referencia al tiempo de simulación para modular las posiciones de fuentes
  // en el modo audio. No usa useState para evitar re-renders innecesarios.
  const timeRef = useRef<number>(0);

  useEffect(() => {
    let animFrameId: number;

    const update = () => {
      timeRef.current += 0.016;
      const sources = computeSources();
      setFieldSources(sources);
      animFrameId = requestAnimationFrame(update);
    };

    animFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameId);
  }, [mode, fieldParams, beatDetected, handData, audioReady]);

  // Calcula las fuentes del frame actual según el modo activo
  function computeSources(): FieldSource[] {
    if (mode === 'audio') {
      return computeAudioSources();
    }

    if (mode === 'hands') {
      return computeHandSources();
    }

    return computeAutonomousSources();
  }

  // Modo audio: fuentes distribuidas en función de los parámetros del campo.
  // La cantidad de fuentes escala con rho (densidad de carga).
  // Las posiciones orbitan el centro moduladas por omega (frecuencia angular).
  function computeAudioSources(): FieldSource[] {
    if (!audioReady) return computeAutonomousSources();

    const count = fieldParamsToSourceCount(fieldParams);
    const positions = generateAudioSourcePositions(
      count,
      fieldParams,
      timeRef.current
    );

    return positions.map((pos, i) => ({
      id:        makeSourceId('audio', i),
      position:  { x: pos.x, y: pos.y },
      charge:    pos.charge,
      // La intensidad escala con E_magnitude — en un beat sube transitoriamente
      intensity: fieldParams.E_magnitude * (beatDetected ? 1.5 : 1.0),
      origin:    'audio' as const,
    }));
  }

  // Modo manos: fuentes creadas por gestos específicos.
  // Pinch → fuente puntual en la posición del contacto pulgar-índice
  // Victory → dos fuentes en las puntas del índice y el medio
  // Sin gesto → fuente suave en la posición del centroide de la mano
  function computeHandSources(): FieldSource[] {
    if (!handData) return computeAutonomousSources();

    const sources: FieldSource[] = [];
    let sourceIndex = 0;

    // Procesar mano izquierda
    if (handData.left?.detected) {
      const { gesture, landmarks, params } = handData.left;

      if (gesture === 'pinch') {
        // Gesto pinch: fuente puntual de carga positiva en el punto de contacto
        const pos = pinchSourcePosition(landmarks);
        sources.push({
          id:       makeSourceId('left-pinch', sourceIndex++),
          position: pos,
          charge:   1,
          intensity: 0.8 + params.velocity * 2,
          origin:   'hands',
        });
      } else if (gesture === 'victory') {
        // Gesto victory: dos fuentes coherentes para interferencia
        const [pos1, pos2] = victorySourcePositions(landmarks);
        sources.push({
          id:       makeSourceId('left-victory-0', sourceIndex++),
          position: pos1,
          charge:   1,
          intensity: 0.6,
          origin:   'hands',
        });
        sources.push({
          id:       makeSourceId('left-victory-1', sourceIndex++),
          position: pos2,
          charge:   -1,
          intensity: 0.6,
          origin:   'hands',
        });
      } else {
        // Sin gesto específico: fuente difusa en el centroide de la mano izquierda.
        // La intensidad escala con la apertura — mano abierta = campo más intenso.
        sources.push({
          id:       makeSourceId('left-hand', sourceIndex++),
          position: params.position,
          charge:   1,
          intensity: params.aperture * 0.7,
          origin:   'hands',
        });
      }
    }

    // Procesar mano derecha
    if (handData.right?.detected) {
      const { gesture, landmarks, params } = handData.right;

      if (gesture === 'pinch') {
        const pos = pinchSourcePosition(landmarks);
        sources.push({
          id:       makeSourceId('right-pinch', sourceIndex++),
          position: pos,
          charge:   -1,
          intensity: 0.8 + params.velocity * 2,
          origin:   'hands',
        });
      } else if (gesture === 'victory') {
        const [pos1, pos2] = victorySourcePositions(landmarks);
        sources.push({
          id:       makeSourceId('right-victory-0', sourceIndex++),
          position: pos1,
          charge:   1,
          intensity: 0.6,
          origin:   'hands',
        });
        sources.push({
          id:       makeSourceId('right-victory-1', sourceIndex++),
          position: pos2,
          charge:   -1,
          intensity: 0.6,
          origin:   'hands',
        });
      } else {
        // La mano derecha crea una fuente de carga negativa para generar
        // líneas de campo que van de la mano izquierda a la derecha,
        // visualizando el flujo de corriente J entre las dos manos.
        sources.push({
          id:       makeSourceId('right-hand', sourceIndex++),
          position: params.position,
          charge:   -1,
          intensity: params.aperture * 0.7,
          origin:   'hands',
        });
      }
    }

    // Si no hay ningún gesto activo con manos detectadas, usar fuentes autónomas suaves
    if (sources.length === 0) return computeAutonomousSources();

    return sources;
  }

  // Estado de reposo autónomo: dipolo electromagnético estático centrado en el canvas.
  // Representa el vacío electromagnético con fluctuaciones suaves —
  // el campo existe aunque no haya entrada externa.
  function computeAutonomousSources(): FieldSource[] {
    // El dipolo oscila suavemente con el tiempo para dar sensación de vida
    const oscillation = Math.sin(timeRef.current * 0.3) * 0.04;

    return [
      {
        id:       'auto-positive',
        position: { x: 0.5 - 0.12 + oscillation, y: 0.5 },
        charge:    1,
        intensity: 0.35,
        origin:   'audio',
      },
      {
        id:       'auto-negative',
        position: { x: 0.5 + 0.12 - oscillation, y: 0.5 },
        charge:   -1,
        intensity: 0.35,
        origin:   'audio',
      },
    ];
  }
}