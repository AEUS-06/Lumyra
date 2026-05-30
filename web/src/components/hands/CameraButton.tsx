'use client';

// Componente visual del botón de activación de cámara.
//
// Responsabilidad única: renderizar el botón con sus estados visuales.
// No gestiona lógica — recibe handlers como props desde HandPanel.

interface CameraButtonProps {
  active:  boolean;
  loading: boolean;
  error:   string | null;
  onToggle: () => void;
}

export function CameraButton({ active, loading, error, onToggle }: CameraButtonProps) {
  const label = loading ? 'iniciando...' : active ? '■ detener cámara' : '▶ activar cámara';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        onClick={onToggle}
        disabled={loading}
        style={{
          width:         '100%',
          padding:       '8px 0',
          background:    'transparent',
          border:        `0.5px solid ${loading ? '#1a2a3a' : active ? '#00f0c0' : '#3a8fff'}`,
          borderRadius:  3,
          cursor:        loading ? 'not-allowed' : 'pointer',
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      11,
          letterSpacing: '0.08em',
          color:         loading ? '#1a2a3a' : active ? '#00f0c0' : '#3a8fff',
          textTransform: 'uppercase',
          transition:    'all 0.15s ease',
        }}
      >
        {label}
      </button>

      {error && (
        <p style={{
          fontFamily:    'var(--font-mono, monospace)',
          fontSize:      9,
          color:         '#ff4444',
          margin:        0,
          letterSpacing: '0.04em',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}