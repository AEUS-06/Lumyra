'use client';

// Scene principal del campo electromagnético de Lumyra.
//
// Responsabilidad única: orquestar los componentes del canvas.
// No calcula geometría, no dibuja directamente, no gestiona hooks de datos.
// Lee del store lo mínimo necesario para pasar props a sus hijos.
//
// La cámara es ortográfica porque la simulación es 2D —
// no hay perspectiva ni profundidad en el campo electromagnético 2D.

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useLumyraStore } from '@/store';
import { useFieldEngine } from '@/hooks';
import { FieldLines } from './field-lines/FieldLines';
import { ParticleSystem } from './particles/ParticleSystem';
import { WaveformOverlay } from './overlays/WaveformOverlay';
import { HandOverlay } from './overlays/HandOverlay';

// Componente interno de la Scene — debe estar dentro del Canvas de R3F
// para poder usar useFrame y acceder al contexto de Three.js
function FieldScene() {
  const fieldSources  = useLumyraStore((s) => s.fieldSources);
  const fieldParams   = useLumyraStore((s) => s.fieldParams);
  const beatDetected  = useLumyraStore((s) => s.beatDetected);
  const isMobile      = useLumyraStore((s) => s.config.isMobile);

  // beatPulse decae por frame — se pasa a los shaders para el efecto de pulso
  const beatPulseRef = useRef(0);
  if (beatDetected) beatPulseRef.current = 1.0;
  beatPulseRef.current *= 0.85; // decaimiento por frame

  // useFieldEngine activa useFieldSources y useFieldAnimation
  const { particlesRef } = useFieldEngine();

  return (
    <>
      <FieldLines
        sources={fieldSources}
        fieldParams={fieldParams}
        beatPulse={beatPulseRef.current}
        isMobile={isMobile}
      />
      <ParticleSystem
        particlesRef={particlesRef}
        beatPulse={beatPulseRef.current}
      />
    </>
  );
}

// Componente público del canvas. Incluye el Canvas de R3F y los overlays 2D.
export function FieldCanvas() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1] }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#04090f' }}
      >
        <FieldScene />
      </Canvas>

      {/* Overlays 2D posicionados sobre el canvas 3D */}
      <WaveformOverlay />
      <HandOverlay />
    </div>
  );
}