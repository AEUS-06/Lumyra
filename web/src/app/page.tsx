'use client';

// Pantalla inicial de Lumyra.
//
// Responsabilidad única: presentar el proyecto y permitir al usuario
// elegir el modo con el que desea entrar al laboratorio.
// No monta ningún sistema de audio, manos ni campo — es una pantalla
// de bienvenida ligera que carga rápido.

import { useRouter } from 'next/navigation';
import { useLumyraStore } from '@/store';
import { AppMode } from '@/store/types/app.types';

export default function HomePage() {
  const router  = useRouter();
  const setMode = useLumyraStore((s) => s.setMode);

  function enterLab(mode: AppMode) {
    setMode(mode);
    router.push('/lab');
  }

  return (
    <main style={{
      width:          '100%',
      height:         '100vh',
      background:     '#04090f',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            56,
      fontFamily:     'var(--font-mono, monospace)',
      position:       'relative',
      overflow:       'hidden',
    }}>

      {/* Wordmark */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{
          fontSize:      'clamp(52px, 10vw, 104px)',
          fontWeight:    700,
          color:         '#ffffff',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          lineHeight:    1,
          margin:        0,
        }}>
          LUMYRA
        </h1>
        <p style={{
          fontSize:      10,
          color:         '#1e4060',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          margin:        0,
        }}>
          donde la física se convierte en experiencia
        </p>
      </div>

      {/* Etiquetas */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['código abierto', 'experimental', 'arte y ciencia', 'electromagnetismo'].map((tag) => (
          <span
            key={tag}
            style={{
              padding:       '4px 10px',
              border:        '0.5px solid #0d1e2e',
              fontSize:      9,
              color:         '#1e4060',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Selector de modos */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <ModeCard
          title="Campo · Audio"
          description="El campo electromagnético modulado por la música. Sube cualquier canción y observa cómo las ecuaciones de Maxwell responden al espectro."
          equation="∇·E = ρ/ε₀"
          onClick={() => enterLab('audio')}
        />
      </div>

    </main>
  );
}

interface ModeCardProps {
  title:       string;
  description: string;
  equation:    string;
  onClick:     () => void;
}

function ModeCard({ title, description, equation, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width:         300,
        padding:       28,
        background:    'transparent',
        border:        '0.5px solid #0d1e2e',
        cursor:        'pointer',
        textAlign:     'left',
        display:       'flex',
        flexDirection: 'column',
        gap:           14,
        transition:    'border-color 0.25s ease, background 0.25s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = '#1e4060';
        el.style.background  = 'rgba(58,143,255,0.04)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = '#0d1e2e';
        el.style.background  = 'transparent';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize:      11,
          fontWeight:    700,
          color:         '#ffffff',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{
          fontSize:      10,
          color:         '#1e4060',
          letterSpacing: '0.04em',
          fontFamily:    'var(--font-mono, monospace)',
        }}>
          {equation}
        </span>
      </div>

      <p style={{
        fontSize:      10,
        color:         '#1e4060',
        lineHeight:    1.8,
        letterSpacing: '0.02em',
        fontWeight:    300,
        margin:        0,
      }}>
        {description}
      </p>

      <span style={{
        fontSize:      9,
        color:         '#1e4060',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginTop:     2,
      }}>
        entrar →
      </span>
    </button>
  );
}