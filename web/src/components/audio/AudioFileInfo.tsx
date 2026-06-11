'use client';

// Información del archivo de audio cargado.
// Responsabilidad única: nombre + duración.

interface AudioFileInfoProps {
  fileName: string;
  duration: string;
  decoding: boolean;
}

export function AudioFileInfo({ fileName, duration, decoding }: AudioFileInfoProps) {
  const displayName = fileName.length > 26
    ? `${fileName.slice(0, 23)}…`
    : fileName;

  return (
    <div style={{
      paddingBottom: '12px',
      borderBottom:  '1px solid var(--color-border)',
    }}>
      <p style={{
        fontFamily:    "'Inter', sans-serif",
        fontSize:      12,
        fontWeight:    400,
        color:         decoding ? 'var(--color-text-muted)' : 'var(--color-active)',
        margin:        0,
        overflow:      'hidden',
        textOverflow:  'ellipsis',
        whiteSpace:    'nowrap',
        transition:    'color 0.2s ease',
      }}>
        {decoding ? 'decodificando…' : displayName}
      </p>

      {!decoding && (
        <p style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      10,
          color:         'var(--color-text-muted)',
          margin:        '4px 0 0',
          letterSpacing: '0.06em',
        }}>
          {duration}
        </p>
      )}
    </div>
  );
}