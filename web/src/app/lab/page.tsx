'use client';

import dynamic from 'next/dynamic';
import { TopBar }         from '@/components/ui';
import { ParameterStrip } from '@/components/ui';
import { AudioPanel }     from '@/components/audio';

const FieldCanvas = dynamic(
  () => import('@/components/canvas').then((m) => m.FieldCanvas),
  {
    ssr:     false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', background: 'var(--color-bg)' }} />
    ),
  }
);

export default function LabPage() {
  return (
    <div style={{
      width:      '100vw',
      height:     '100vh',
      position:   'relative',
      overflow:   'hidden',
      background: 'var(--color-bg)',
    }}>
      {/* Canvas de campo — capa base */}
      <div style={{
        position: 'absolute',
        inset:    0,
        zIndex:   0,
      }}>
        <FieldCanvas />
      </div>

      {/* UI sobre el campo */}
      <TopBar />
      <AudioPanel />
      <ParameterStrip />
    </div>
  );
}