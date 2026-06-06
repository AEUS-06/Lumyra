'use client';

// Página del laboratorio principal de Lumyra.
//
// Responsabilidad única: ensamblar FieldCanvas, los paneles de modo
// y la UI global (TopBar, ParameterStrip) en el layout correcto.
// No contiene lógica de negocio — solo composición de componentes.
//
// El canvas ocupa el 100% de la pantalla.
// TopBar y ParameterStrip flotan sobre él con z-index elevado.
// El panel de modo (audio o manos) se monta condicionalmente
// según el modo activo en el store.

import dynamic from 'next/dynamic';
import { useLumyraStore } from '@/store';
import { TopBar }         from '@/components/ui';
import { ParameterStrip } from '@/components/ui';
import { AudioPanel }     from '@/components/audio';
import { HandPanel }      from '@/components/hands';

// FieldCanvas usa Three.js y Web APIs — no puede renderizar en servidor
const FieldCanvas = dynamic(
  () => import('@/components/canvas').then((m) => m.FieldCanvas),
  { ssr: false }
);

export default function LabPage() {
  const mode = useLumyraStore((s) => s.mode);

  return (
    <div style={{
      width:    '100vw',
      height:   '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: '#04090f',
    }}>
      {/* Canvas full screen — base de todo el laboratorio */}
      <div style={{
        position: 'absolute',
        inset:    0,
        zIndex:   0,
      }}>
        <FieldCanvas />
      </div>

      {/* TopBar — flota sobre el canvas */}
      <TopBar />

      {/* Panel de modo — condicional según audio o manos */}
      {mode === 'audio' && <AudioPanel />}
      {mode === 'hands' && <HandPanel />}

      {/* ParameterStrip — flota en el borde inferior */}
      <ParameterStrip />
    </div>
  );
}