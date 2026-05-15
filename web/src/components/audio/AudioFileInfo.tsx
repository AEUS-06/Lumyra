'use client';

// Componente visual que muestra la información del archivo de audio cargado.
//
// Responsabilidad única: renderizar el nombre y duración del archivo.
// No accede al store ni calcula nada — recibe los datos como props.

interface AudioFileInfoProps {
  fileName: string;
  duration: string;
  decoding: boolean;
}

export function AudioFileInfo({ fileName, duration, decoding }: AudioFileInfoProps) {
  // Truncar el nombre si es muy largo para que no rompa el layout del panel
  const displayName = fileName.length > 24
    ? `${fileName.slice(0, 21)}...`
    : fileName;

  return (
    <div style={{
      padding:    '8px 0',
      borderBottom: '0.5px solid #0d1a26',
    }}>
      <p style={{
        fontFamily:    'var(--font-mono, monospace)',
        fontSize:      11,
        color:         decoding ? '#3a5a7a' : '#7fc4ff',
        margin:        0,
        letterSpacing: '0.04em',
        overflow:      'hidden',
        textOverflow:  'ellipsis',
        whiteSpace:    'nowrap',
      }}>
        {decoding ? 'decodificando...' : displayName}
      </p>

      {!decoding && (
        <p style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      10,
          color:         '#2a3a4a',
          margin:        '2px 0 0',
          letterSpacing: '0.06em',
        }}>
          {duration}
        </p>
      )}
    </div>
  );
}