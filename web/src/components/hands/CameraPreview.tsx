'use client';

// Componente visual del thumbnail del feed de cámara.
//
// Responsabilidad única: renderizar el elemento <video> que muestra
// el feed de la cámara como preview pequeño.
// La ref del video viene de useHandEngine para que MediaPipe
// pueda leer los frames del mismo elemento.

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  visible:  boolean;
}

export function CameraPreview({ videoRef, visible }: CameraPreviewProps) {
  if (!visible) return null;

  return (
    <div style={{
      position:     'relative',
      width:        '100%',
      aspectRatio:  '16/9',
      overflow:     'hidden',
      border:       '0.5px solid #0d1a26',
      borderRadius: 2,
      background:   '#000',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width:      '100%',
          height:     '100%',
          objectFit:  'cover',
          transform:  'scaleX(-1)', // espejo para que se vea natural
          display:    'block',
          opacity:    0.7,
        }}
      />

      {/* Indicador de cámara activa */}
      <div style={{
        position:  'absolute',
        top:       6,
        right:     6,
        width:     5,
        height:    5,
        borderRadius: '50%',
        background: '#00f0c0',
        boxShadow:  '0 0 4px #00f0c0',
      }} />
    </div>
  );
}