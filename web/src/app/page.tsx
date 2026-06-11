'use client';

// Pantalla inicial de Lumyra.
// Responsabilidad única: presentar el proyecto y dejar entrar al lab.
// Carga liviana — sin audio, sin campo, sin manos.

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
      background:     'var(--color-bg)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            64,
      position:       'relative',
      overflow:       'hidden',
    }}>

      {/* Grid de fondo — instrumental, no decorativo */}
      <BackgroundGrid />

      {/* Wordmark — display Bebas Neue, ocupa el ancho */}
      <div style={{
        textAlign:     'center',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           20,
        position:      'relative',
        zIndex:        1,
      }}>
        <h1 style={{
          fontFamily:    "'Bebas Neue', 'Impact', sans-serif",
          fontSize:      'clamp(80px, 16vw, 200px)',
          fontWeight:    400,          /* Bebas Neue es intrínsecamente pesada */
          color:         'var(--color-text-primary)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight:    0.9,
          margin:        0,
        }}>
          LUMYRA
        </h1>

        {/* Ecuación + descripción en la misma línea */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        16,
        }}>
          <span style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      11,
            color:         'var(--color-active)',
            letterSpacing: '0.06em',
            opacity:       0.7,
          }}>
            ∇×B = μ₀J + μ₀ε₀∂E/∂t
          </span>
          <span style={{
            width:      1,
            height:     10,
            background: 'var(--color-border-mid)',
            flexShrink: 0,
          }} />
          <p style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      11,
            fontWeight:    300,
            color:         'var(--color-text-secondary)',
            letterSpacing: '0.04em',
            margin:        0,
          }}>
            donde la física se convierte en experiencia
          </p>
        </div>
      </div>

      {/* Etiquetas de contexto */}
      <div style={{
        display:         'flex',
        gap:             0,
        flexWrap:        'wrap',
        justifyContent:  'center',
        position:        'relative',
        zIndex:          1,
      }}>
        {['código abierto', 'experimental', 'arte y ciencia', 'electromagnetismo'].map((tag, i) => (
          <span
            key={tag}
            style={{
              padding:       '5px 14px',
              border:        '1px solid var(--color-border)',
              borderLeft:    i === 0 ? '1px solid var(--color-border)' : 'none',
              fontSize:      9,
              fontFamily:    "'JetBrains Mono', monospace",
              color:         'var(--color-text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Botón de entrada — brutalista, sin border-radius, hover invierte */}
      <div style={{ position: 'relative', zIndex: 1 }}>
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

// ─── Grid de fondo ────────────────────────────────────────────────────────────

function BackgroundGrid() {
  return (
    <div style={{
      position:    'absolute',
      inset:       0,
      pointerEvents: 'none',
      zIndex:      0,
      overflow:    'hidden',
    }}>
      {/* Líneas horizontales */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={`h${i}`} style={{
          position:  'absolute',
          left:      0,
          right:     0,
          top:       `${(i + 1) * 8.333}%`,
          height:    1,
          background: 'var(--color-border)',
          opacity:   0.35,
        }} />
      ))}
      {/* Líneas verticales */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`v${i}`} style={{
          position:   'absolute',
          top:        0,
          bottom:     0,
          left:       `${(i + 1) * 11.11}%`,
          width:      1,
          background: 'var(--color-border)',
          opacity:    0.35,
        }} />
      ))}
      {/* Acento diagonal en esquina */}
      <div style={{
        position:    'absolute',
        bottom:      0,
        right:       0,
        width:       320,
        height:      320,
        background:  `radial-gradient(circle at bottom right, rgba(58,143,255,0.06) 0%, transparent 70%)`,
      }} />
      <div style={{
        position:    'absolute',
        top:         0,
        left:        0,
        width:       280,
        height:      280,
        background:  `radial-gradient(circle at top left, rgba(0,240,192,0.04) 0%, transparent 70%)`,
      }} />
    </div>
  );
}

// ─── ModeCard ─────────────────────────────────────────────────────────────────

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
        width:         340,
        padding:       '28px 32px',
        background:    'transparent',
        border:        '2px solid var(--color-text-primary)',
        cursor:        'pointer',
        textAlign:     'left',
        display:       'flex',
        flexDirection: 'column',
        gap:           16,
        /* Sin border-radius — brutalista */
        borderRadius:  0,
        /* Transición rápida en hover */
        transition:    'background 0.12s ease, color 0.12s ease, transform 0.12s ease',
        position:      'relative',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background  = 'var(--color-text-primary)';
        el.style.color       = 'var(--color-bg)';
        el.style.transform   = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background  = 'transparent';
        el.style.color       = '';
        el.style.transform   = 'scale(1)';
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontFamily:    "'Bebas Neue', sans-serif",
          fontSize:      22,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight:    1,
          color:         'inherit',
        }}>
          {title}
        </span>
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      10,
          color:         'var(--color-active)',
          letterSpacing: '0.04em',
          flexShrink:    0,
          paddingTop:    4,
        }}>
          {equation}
        </span>
      </div>

      {/* Descripción */}
      <p style={{
        fontFamily:    "'Inter', sans-serif",
        fontSize:      11,
        fontWeight:    300,
        color:         'var(--color-text-secondary)',
        lineHeight:    1.8,
        letterSpacing: '0.01em',
        margin:        0,
      }}>
        {description}
      </p>

      {/* CTA */}
      <span style={{
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      10,
        color:         'var(--color-active)',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        marginTop:     4,
      }}>
        entrar →
      </span>
    </button>
  );
}