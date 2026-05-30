'use client';

// Panel de manos del modo campo / manos de Lumyra.
//
// Responsabilidad única: componer CameraButton, CameraPreview
// y GestureTag sin contener lógica propia.
// Toda la lógica vive en los hooks internos.

import { useHandEngine } from '@/hooks';
import { useLumyraStore } from '@/store';
import { useCameraToggle } from './hooks/useCameraToggle';
import { useGestureDisplay } from './hooks/useGestureDisplay';
import { CameraButton } from './CameraButton';
import { CameraPreview } from './CameraPreview';
import { GestureTag } from './GestureTag';

export function HandPanel() {
  const cameraToggle = useCameraToggle();
  const engine       = useHandEngine();
  const handData     = useLumyraStore((s) => s.handData);

  // Gestos actuales de cada mano — neutral si no hay datos
  const leftGesture  = handData?.left?.gesture  ?? 'neutral';
  const rightGesture = handData?.right?.gesture ?? 'neutral';

  const leftDisplay  = useGestureDisplay(leftGesture);
  const rightDisplay = useGestureDisplay(rightGesture);

  return (
    <div style={{
      position:      'absolute',
      top:           48,
      left:          0,
      width:         220,
      background:    'rgba(4,9,15,0.92)',
      borderRight:   '0.5px solid #0d1a26',
      padding:       '12px 14px',
      display:       'flex',
      flexDirection: 'column',
      gap:           12,
    }}>
      {/* Encabezado */}
      <span style={{
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      9,
        color:         '#2a4a6a',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        campo / manos
      </span>

      {/* Control de cámara */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      9,
          color:         '#1a3a5a',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          cámara
        </span>

        <CameraButton
          active={cameraToggle.cameraActive}
          loading={cameraToggle.loading}
          error={cameraToggle.error}
          onToggle={cameraToggle.toggle}
        />

        <CameraPreview
          videoRef={engine.videoRef}
          visible={cameraToggle.cameraActive}
        />
      </div>

      {/* Gestos detectados */}
      {cameraToggle.cameraActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{
            fontFamily:    'var(--font-mono, monospace)',
            fontSize:      9,
            color:         '#1a3a5a',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderTop:     '0.5px solid #0d1a26',
            paddingTop:    10,
          }}>
            gestos
          </span>

          <GestureTag
            hand="izquierda"
            display={leftDisplay}
            detected={handData?.left?.detected ?? false}
          />

          <GestureTag
            hand="derecha"
            display={rightDisplay}
            detected={handData?.right?.detected ?? false}
          />
        </div>
      )}
    </div>
  );
}