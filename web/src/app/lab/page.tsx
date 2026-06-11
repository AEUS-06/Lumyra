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
      <div style={{ width: '100%', height: '100%', background: '#04090f' }} />
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
      background: '#04090f',
    }}>
      <div style={{
        position: 'absolute',
        top:      0,
        left:     0,
        right:    0,
        bottom:   0,
        width:    '100%',
        height:   '100%',
        zIndex:   0,
      }}>
        <FieldCanvas />
      </div>

      <TopBar />
      <AudioPanel />
      <ParameterStrip />
    </div>
  );
}