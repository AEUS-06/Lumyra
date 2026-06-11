'use client';

// Hook que genera FieldSource[] reactivas al audio en tiempo real.
// Las fuentes cambian posición, carga e intensidad según los parámetros
// del campo que el motor de audio escribe en el store cada frame FFT.

import { useEffect, useRef } from 'react';
import { generateAudioSourcePositions, fieldParamsToSourceCount } from '@/lib';
import { useLumyraStore } from '@/store';
import { FieldSource }    from '@/store/types/field.types';

function makeId(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

export function useFieldSources(): void {
  const setFieldSources = useLumyraStore((s) => s.setFieldSources);
  const timeRef         = useRef(0);
  const rafRef          = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      timeRef.current += 0.016;

      // Leer parámetros actuales sin suscribirse — getState() no dispara re-renders
      const { fieldParams, audioReady } = useLumyraStore.getState();

      let sources: FieldSource[];

      if (audioReady) {
        // Modo audio: fuentes distribuidas según energía del campo
        const count     = fieldParamsToSourceCount(fieldParams);
        const positions = generateAudioSourcePositions(count, fieldParams, timeRef.current);

        sources = positions.map((pos, i) => ({
          id:       makeId('audio', i),
          position: { x: pos.x, y: pos.y },
          charge:   pos.charge,
          // La intensidad pulsa con E_magnitude — sube en beats
          intensity: Math.max(0.1, fieldParams.E_magnitude),
          origin:   'audio' as const,
        }));
      } else {
        // Reposo autónomo: dipolo que respira suavemente
        const osc = Math.sin(timeRef.current * 0.4) * 0.03;
        sources = [
          {
            id:       'auto-pos',
            position: { x: 0.5 - 0.13 + osc, y: 0.5 },
            charge:    1,
            intensity: 0.3,
            origin:   'audio' as const,
          },
          {
            id:       'auto-neg',
            position: { x: 0.5 + 0.13 - osc, y: 0.5 },
            charge:   -1,
            intensity: 0.3,
            origin:   'audio' as const,
          },
        ];
      }

      setFieldSources(sources);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [setFieldSources]);
}