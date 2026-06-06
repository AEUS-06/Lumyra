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

  // Al seleccionar un modo, lo guarda en el store y navega al laboratorio
  function enterLab(mode: AppMode) {
    setMode(mode);
    router.push('/lab');
  }

  return (
    <main style={{
      width:           '100%',
      height:          '100vh',
      background:      '#04090f',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             48,
      fontFamily:      'var(--font-mono, monospace)',
      position:        'relative',
      overflow:        'hidden',
    }}>

      {/* Wordmark principal */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{
          fontSize:      'clamp(48px, 10vw, 96px)',
          fontWeight:    700,
          color:         '#ffffff',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight:    1,
        }}>
          LUMYRA
        </h1>
        <p style={{
          fontSize:      11,
          color:         '#1a3a5a',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}>
          where physics becomes experience
        </p>
      </div>

      {/* Tags del proyecto */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['open source', 'experimental', 'arte y ciencia', 'electromagnetismo'].map((tag) => (
          <span
            key={tag}
            style={{
              padding:       '5px 12px',
              border:        '0.5px solid #0d1a26',
              fontSize:      9,
              color:         '#1a3a5a',
              letterSpacing: '0.1em',
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
        <ModeCard
          title="Campo · Manos"
          description="Tus manos como fuentes de carga eléctrica. La posición, apertura y gestos controlan el campo en tiempo real."
          equation="F = q(E + v×B)"
          onClick={() => enterLab('hands')}
        />
      </div>

    </main>
  );
}

// Tarjeta de selección de modo
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
        width:         280,
        padding:       24,
        background:    'transparent',
        border:        '0.5px solid #0d1a26',
        cursor:        'pointer',
        textAlign:     'left',
        display:       'flex',
        flexDirection: 'column',
        gap:           12,
        transition:    'border-color 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a3a5a';
        (e.currentTarget as HTMLButtonElement).style.background  = 'rgba(58,143,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#0d1a26';
        (e.currentTarget as HTMLButtonElement).style.background  = 'transparent';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize:      11,
          fontWeight:    700,
          color:         '#fff',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{
          fontSize:      9,
          color:         '#1a3a5a',
          letterSpacing: '0.06em',
          fontStyle:     'normal',
        }}>
          {equation}
        </span>
      </div>

      <p style={{
        fontSize:      10,
        color:         '#1a3a5a',
        lineHeight:    1.7,
        letterSpacing: '0.02em',
        fontWeight:    300,
      }}>
        {description}
      </p>

      <span style={{
        fontSize:      9,
        color:         '#1a3a5a',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop:     4,
      }}>
        entrar →
      </span>
    </button>
  );
}