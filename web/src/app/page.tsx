'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Canvas de campo — corre detrás de TODA la página ────────────────────────
// Se monta una sola vez, fixed, z-index 0. Todo el contenido va encima.

function GlobalFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    let raf = 0;
    let W = 0, H = 0;

    function resize() {
      if (!canvas) return;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W * window.devicePixelRatio;
      canvas.height = H * window.devicePixelRatio;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);

    // Campo eléctrico 2D
    function efield(px: number, py: number, srcs: {x:number;y:number;q:number}[]) {
      let ex = 0, ey = 0;
      for (const s of srcs) {
        const dx = px - s.x, dy = py - s.y;
        const r = Math.sqrt(dx*dx + dy*dy);
        if (r < 0.008) continue;
        const m = s.q / r;
        ex += (dx/r)*m; ey += (dy/r)*m;
      }
      return { ex, ey };
    }

    // Trazar una línea de campo
    function traceLine(sx: number, sy: number, srcs: {x:number;y:number;q:number}[]) {
      const pts: [number,number][] = [[sx,sy]];
      let x = sx, y = sy;
      for (let i = 0; i < 260; i++) {
        const { ex, ey } = efield(x, y, srcs);
        const mag = Math.sqrt(ex*ex+ey*ey);
        if (mag < 1e-6) break;
        x += (ex/mag)*0.0045; y += (ey/mag)*0.0045;
        if (x < -0.12 || x > 1.12 || y < -0.12 || y > 1.12) break;
        let stop = false;
        for (const s of srcs) {
          if (s.q < 0) {
            const d = Math.sqrt((x-s.x)**2+(y-s.y)**2);
            if (d < 0.022) { stop = true; break; }
          }
        }
        if (stop) break;
        pts.push([x,y]);
      }
      return pts;
    }

    // Sistema de partículas ligeras
    const PARTICLE_COUNT = 34;
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: (i * 0.618033) % 1,
      y: (i * 0.381966) % 1,
      vx: 0, vy: 0,
    }));

    function drawFrame(t: number) {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      const slow = t * 0.00014;

      // Fuentes: un dipolo principal + una tercera carga que orbita
      const srcs = [
        { x: 0.28 + Math.sin(slow * 0.55) * 0.07, y: 0.5  + Math.cos(slow * 0.4)  * 0.09, q:  1   },
        { x: 0.72 + Math.sin(slow * 0.5  + 1) * 0.07, y: 0.5 + Math.cos(slow * 0.35 + 2) * 0.09, q: -1 },
        { x: 0.5  + Math.cos(slow * 0.28) * 0.22, y: 0.25 + Math.sin(slow * 0.7)  * 0.06, q:  0.45 },
      ];

      // ── Líneas de campo ───────────────────────────────────────────────────
      const nLines = 12;
      for (const src of srcs) {
        if (src.q <= 0) continue;
        for (let i = 0; i < nLines; i++) {
          const angle = (i / nLines) * Math.PI * 2;
          const sx = src.x + Math.cos(angle) * 0.024;
          const sy = src.y + Math.sin(angle) * 0.024;
          const pts = traceLine(sx, sy, srcs);
          if (pts.length < 3) continue;

          ctx.beginPath();
          ctx.moveTo(pts[0][0]*W, pts[0][1]*H);
          for (let k = 1; k < pts.length; k++) {
            ctx.lineTo(pts[k][0]*W, pts[k][1]*H);
          }
          ctx.strokeStyle = 'rgba(58,143,255,0.10)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // ── Glows de las cargas ───────────────────────────────────────────────
      for (const src of srcs) {
        const cx = src.x * W, cy = src.y * H;
        const r = (Math.abs(src.q) * 9 + 5);
        const col = src.q > 0 ? '58,143,255' : '255,74,110';
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
        grd.addColorStop(0, `rgba(${col},0.13)`);
        grd.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${col},0.55)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Partículas ────────────────────────────────────────────────────────
      for (const p of particles) {
        const { ex, ey } = efield(p.x, p.y, srcs);
        const mag = Math.sqrt(ex*ex+ey*ey);
        const nx = ex/(mag+0.001), ny = ey/(mag+0.001);
        const force = 0.00006;
        p.vx = (p.vx + nx*force) * 0.97;
        p.vy = (p.vy + ny*force) * 0.97;
        const spd = Math.sqrt(p.vx*p.vx+p.vy*p.vy);
        if (spd > 0.0055) { p.vx *= 0.0055/spd; p.vy *= 0.0055/spd; }
        p.x = ((p.x + p.vx) % 1 + 1) % 1;
        p.y = ((p.y + p.vy) % 1 + 1) % 1;

        // Trail
        ctx.beginPath();
        ctx.moveTo(p.x*W, p.y*H);
        ctx.lineTo((p.x - p.vx*18)*W, (p.y - p.vy*18)*H);
        ctx.strokeStyle = 'rgba(0,240,192,0.22)';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x*W, p.y*H, 1.3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,240,192,0.38)';
        ctx.fill();
      }
    }

    function loop(t: number) {
      drawFrame(t);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Hook de scroll reveal ────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Wrapper de sección con reveal ───────────────────────────────────────────

function Reveal({ children, delay = 0, style }: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Label de sección ─────────────────────────────────────────────────────────

function Label({ children }: { children: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
    }}>
      <div style={{ width: 20, height: 1, background: 'rgba(58,143,255,0.6)' }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'rgba(58,143,255,0.7)',
      }}>
        {children}
      </span>
    </div>
  );
}

// ─── Divisor ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '72px 0' }} />;
}

// ─── Botón "Entrar al Lab" ────────────────────────────────────────────────────

function EnterButton({ size = 'normal' }: { size?: 'normal' | 'large' }) {
  const [hovered, setHovered] = useState(false);
  const pad = size === 'large' ? '22px 48px' : '16px 36px';
  const fs  = size === 'large' ? 22 : 17;
  return (
    <a
      href="/lab"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 14,
        padding: pad,
        background: hovered ? '#E8E6E0' : 'transparent',
        border: '1.5px solid #E8E6E0',
        color: hovered ? '#050508' : '#E8E6E0',
        textDecoration: 'none',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: fs, letterSpacing: '0.18em',
        transition: 'background 0.14s ease, color 0.14s ease',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      ENTRAR AL LAB
      <span style={{ fontSize: fs * 0.9, opacity: 0.7 }}>→</span>
    </a>
  );
}

// ─── Tarjeta de ecuación ──────────────────────────────────────────────────────

function EqCard({ label, eq, explain, delay = 0 }: {
  label: string; eq: string; explain: string; delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        borderLeft: '2px solid rgba(58,143,255,0.35)',
        paddingLeft: 20, paddingTop: 4, paddingBottom: 4,
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 'clamp(12px, 1.8vw, 15px)',
        color: 'rgba(58,143,255,0.9)',
        lineHeight: 1.6, marginBottom: 8,
        whiteSpace: 'pre',
        overflowX: 'auto',
      }}>
        {eq}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13, fontWeight: 300,
        color: 'rgba(232,230,224,0.5)',
        lineHeight: 1.7,
      }}>
        {explain}
      </div>
    </div>
  );
}

// ─── Diagrama pipeline de audio (SVG) ────────────────────────────────────────

function PipelineDiagram() {
  const { ref, visible } = useReveal();
  const steps = [
    { label: 'AUDIO',   sub: 'MP3 / WAV',      color: '#3A8FFF' },
    { label: 'FFT',     sub: 'X(f) = Σ x·e⁻ʲ', color: '#00F0C0' },
    { label: 'BANDAS',  sub: 'bass mid high…',  color: '#00F0C0' },
    { label: 'MAPEO',   sub: 'bands → EM',      color: '#FF4A6E' },
    { label: 'CAMPO',   sub: 'ρ  J  ∂B/∂t',    color: '#3A8FFF' },
  ];
  const bw = 100, bh = 52, gap = 28, total = steps.length * bw + (steps.length - 1) * gap;

  return (
    <div ref={ref} style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${total + 20} 80`} style={{ display: 'block', width: '100%', maxWidth: total + 20, margin: '0 auto' }}>
        {steps.map((s, i) => {
          const x = 10 + i * (bw + gap);
          const cx = x + bw / 2;
          return (
            <g key={s.label}>
              {i > 0 && (
                <>
                  <line x1={x - gap} y1={40} x2={x} y2={40} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3 2" />
                  <polygon points={`${x-2},36 ${x+6},40 ${x-2},44`} fill="rgba(255,255,255,0.12)" />
                </>
              )}
              <rect
                x={x} y={14} width={bw} height={bh} rx={0}
                fill="rgba(255,255,255,0.025)"
                stroke={s.color} strokeWidth={1}
                opacity={visible ? 1 : 0}
                style={{ transition: `opacity 0.5s ease ${i * 110}ms` }}
              />
              <text x={cx} y={37} textAnchor="middle"
                fill={s.color} fontFamily="'Bebas Neue', sans-serif"
                fontSize={13} letterSpacing={1.5}
                opacity={visible ? 1 : 0}
                style={{ transition: `opacity 0.5s ease ${i * 110 + 80}ms` }}
              >{s.label}</text>
              <text x={cx} y={52} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontFamily="'JetBrains Mono', monospace"
                fontSize={7.5}
                opacity={visible ? 1 : 0}
                style={{ transition: `opacity 0.5s ease ${i * 110 + 140}ms` }}
              >{s.sub}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Diagrama de bandas espectrales ──────────────────────────────────────────

function BandsDiagram() {
  const { ref, visible } = useReveal();
  const bands = [
    { name: 'SUB',      range: '20–60 Hz',     param: 'μ₀', color: '#9B59F5', pct: 10 },
    { name: 'BASS',     range: '60–250 Hz',    param: 'ρ',  color: '#3A8FFF', pct: 18 },
    { name: 'MID',      range: '250–2k Hz',    param: 'J',  color: '#00F0C0', pct: 38 },
    { name: 'HIGH',     range: '2k–8k Hz',     param: '∂B/∂t', color: '#FFB830', pct: 22 },
    { name: 'PRESENCE', range: '8k–20k Hz',    param: 'ε₀ ⁻¹', color: '#FF4A6E', pct: 12 },
  ];

  return (
    <div ref={ref}>
      {/* Barra espectral */}
      <div style={{ display: 'flex', height: 28, gap: 2, marginBottom: 20 }}>
        {bands.map((b, i) => (
          <div key={b.name} style={{
            flex: b.pct, background: b.color,
            opacity: visible ? 0.65 : 0,
            transition: `opacity 0.5s ease ${i * 80}ms`,
          }} />
        ))}
      </div>
      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {bands.map((b, i) => (
          <div key={b.name} style={{
            padding: '14px 14px 12px',
            borderLeft: `2px solid ${b.color}`,
            paddingLeft: 12,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: `opacity 0.5s ease ${i * 80 + 180}ms, transform 0.5s ease ${i * 80 + 180}ms`,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: b.color, letterSpacing: '0.1em' }}>{b.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '3px 0' }}>{b.range}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{b.param}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tarjeta de Maxwell ───────────────────────────────────────────────────────

function MaxwellCards() {
  const items = [
    { eq: '∇·E = ρ/ε₀',               name: 'Gauss eléctrica',  audio: 'bass → ρ',     color: '#3A8FFF', note: 'Las fuentes del campo nacen aquí.' },
    { eq: '∇·B = 0',                   name: 'Gauss magnética',  audio: 'no hay monopolos', color: 'rgba(255,255,255,0.2)', note: 'Las líneas de campo siempre son cerradas.' },
    { eq: '∇×E = −∂B/∂t',             name: 'Faraday',          audio: 'high → ∂B/∂t', color: '#FF4A6E', note: 'Un campo magnético que cambia crea rotación eléctrica.' },
    { eq: '∇×B = μ₀J + μ₀ε₀ ∂E/∂t',  name: 'Ampère-Maxwell',  audio: 'mid → J',       color: '#00F0C0', note: 'Las corrientes y el campo en movimiento crean campos magnéticos.' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
      {items.map((item, i) => {
        const { ref, visible } = useReveal();
        return (
          <div
            key={item.name}
            ref={ref}
            style={{
              padding: '20px',
              border: `1px solid ${item.color}`,
              background: 'rgba(5,5,8,0.6)',
              backdropFilter: 'blur(2px)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(14px)',
              transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(10px, 1.5vw, 13px)', color: item.color, marginBottom: 10, lineHeight: 1.5 }}>{item.eq}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 6 }}>{item.name}</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 300, color: 'rgba(232,230,224,0.45)', lineHeight: 1.6, marginBottom: 8 }}>{item.note}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>{item.audio}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  return (
    <>
      <style>{`
        :root {
          --bg:     #050508;
          --text:   #E8E6E0;
          --sub:    rgba(232,230,224,0.55);
          --muted:  rgba(232,230,224,0.28);
          --accent: #3A8FFF;
          --teal:   #00F0C0;
          --red:    #FF4A6E;
          --border: rgba(255,255,255,0.06);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes blinkDot { 0%,100% { opacity:.2 } 50% { opacity:1 } }
        @keyframes scrollBounce { 0%,100% { transform:translateX(-50%) translateY(0) } 50% { transform:translateX(-50%) translateY(6px) } }

        .lum-link {
          color: var(--accent); text-decoration: none;
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          letter-spacing: 0.1em; border-bottom: 1px solid rgba(58,143,255,0.3);
          transition: border-color 0.2s ease;
        }
        .lum-link:hover { border-color: var(--accent); }

        /* Overlay oscuro sobre el canvas para que el contenido sea legible */
        .content-overlay {
          position: relative;
          z-index: 1;
          background: rgba(5,5,8,0.0);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:0.001ms!important; transition-duration:0.001ms!important; }
        }
      `}</style>

      {/* ── Canvas fijo de fondo — toda la página ── */}
      <GlobalFieldCanvas />

      <main style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>

        {/* ══ HERO ═════════════════════════════════════════════════════════ */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(60px,10vw,120px) 24px clamp(40px,6vw,80px)',
          position: 'relative',
          // Gradiente suave para separar el texto del canvas sin ocultarlo
          background: 'linear-gradient(to bottom, rgba(5,5,8,0.45) 0%, rgba(5,5,8,0.25) 50%, rgba(5,5,8,0.65) 100%)',
        }}>

          {/* Ecuación ambient arriba */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(9px,1.2vw,11px)',
            color: 'rgba(58,143,255,0.55)',
            letterSpacing: '0.08em',
            marginBottom: 36,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 1.4s ease 0.5s',
          }}>
            ∇×B = μ₀J + μ₀ε₀∂E/∂t
          </div>

          {/* Wordmark */}
          <h1 style={{
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            fontSize: 'clamp(80px, 20vw, 230px)',
            fontWeight: 400,
            color: 'var(--text)',
            letterSpacing: '0.1em',
            lineHeight: 0.87,
            textAlign: 'center',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 1s ease 0.08s, transform 1s ease 0.08s',
            userSelect: 'none',
          }}>
            LUMYRA
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(12px, 1.8vw, 15px)',
            fontWeight: 300,
            color: 'var(--sub)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginTop: 28,
            textAlign: 'center',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 1s ease 0.45s',
          }}>
            donde la física se convierte en experiencia
          </p>

          {/* Tags */}
          <div style={{
            display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center',
            marginTop: 32,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 1s ease 0.75s',
          }}>
            {['open source', 'experimental', 'arte & ciencia', 'electromagnetismo', 'música'].map((tag, i) => (
              <span key={tag} style={{
                padding: '5px 13px',
                border: '1px solid var(--border)',
                borderLeft: i === 0 ? '1px solid var(--border)' : 'none',
                fontSize: 8.5, fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* CTA hero — para quien quiere entrar ya */}
          <div style={{
            marginTop: 48,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 1s ease 1.1s',
          }}>
            <EnterButton size="large" />
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute', bottom: 32, left: '50%',
            animation: 'scrollBounce 2.5s ease-in-out infinite',
            opacity: loaded ? 0.3 : 0,
            transition: 'opacity 1.5s ease 2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 1, height: 32, background: 'var(--text)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7.5, letterSpacing: '0.2em', color: 'var(--text)' }}>SCROLL</span>
          </div>
        </section>

        {/* ── Separador con fondo opaco gradual ── */}
        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* ══ CONTENIDO PRINCIPAL ══════════════════════════════════════════ */}
        {/* Fondo semitransparente sobre el canvas para legibilidad en texto largo */}
        <div style={{
          background: 'rgba(5,5,8,0.82)',
          backdropFilter: 'blur(0px)',
        }}>
          <div style={{
            maxWidth: 880, margin: '0 auto',
            padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,48px)',
          }}>

            {/* ── QUÉ ES ─── */}
            <Reveal>
              <Label>el proyecto</Label>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(30px, 5.5vw, 58px)',
                letterSpacing: '0.07em', lineHeight: 1.05,
                color: 'var(--text)', marginBottom: 24,
              }}>
                UN LABORATORIO DONDE<br />
                <span style={{ color: 'var(--accent)' }}>LA FÍSICA ES MATERIAL CREATIVO</span>
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(14px, 1.9vw, 17px)', fontWeight: 300,
                color: 'var(--sub)', lineHeight: 2, maxWidth: 660, marginBottom: 18,
              }}>
                Lumyra traduce el electromagnetismo en experiencias audiovisuales.
                Campos que pueden verse. Ondas que pueden escucharse. Patrones invisibles
                que se convierten en luz, movimiento y sonido.
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(14px, 1.9vw, 17px)', fontWeight: 300,
                color: 'rgba(232,230,224,0.42)', lineHeight: 2, maxWidth: 640,
                fontStyle: 'italic',
              }}>
                No es un simulador educativo ni una herramienta musical convencional.
                Es algo intermedio — un espacio donde la física y el arte se influyen mutuamente.
              </p>
            </Reveal>

            <Divider />

            {/* ── FILOSOFÍA ─── */}
            <Reveal>
              <Label>filosofía</Label>
              <blockquote style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(22px, 4vw, 44px)',
                letterSpacing: '0.06em', lineHeight: 1.2,
                borderLeft: '2px solid var(--teal)',
                paddingLeft: 28, marginBottom: 48,
              }}>
                LA FÍSICA NO SOLO PUEDE ESTUDIARSE.<br />
                <span style={{ color: 'var(--teal)' }}>TAMBIÉN PUEDE EXPERIMENTARSE.</span>
              </blockquote>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 2 }}>
                {[
                  { icon: '◈', title: 'Visualización generativa', text: 'Campos y ondas tomando forma en tiempo real, fotograma a fotograma.' },
                  { icon: '◎', title: 'Música emergente', text: 'Sonido que nace del comportamiento de sistemas dinámicos, no de samples.' },
                  { icon: '∿', title: 'Simulación física', text: 'Inspirada en las ecuaciones de Maxwell, resonancia e interferencia.' },
                  { icon: '⊛', title: 'Resonancia audiovisual', text: 'Sincronía directa entre el espectro sonoro y la geometría del campo.' },
                ].map(({ icon, title, text }) => (
                  <div key={title} style={{
                    padding: '18px 16px 16px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.015)',
                  }}>
                    <div style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.1em', color: 'rgba(232,230,224,0.8)', marginBottom: 6 }}>{title}</div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.75 }}>{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Divider />

            {/* ── LA FÍSICA — sin asustar ─── */}
            <Reveal>
              <Label>las ecuaciones que mueven todo</Label>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(28px, 4.5vw, 50px)',
                letterSpacing: '0.07em', marginBottom: 16, color: 'var(--text)',
              }}>
                CUATRO ECUACIONES.<br />
                <span style={{ color: 'var(--accent)' }}>TODO EL ELECTROMAGNETISMO.</span>
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(14px, 1.8vw, 16px)', fontWeight: 300,
                color: 'var(--sub)', lineHeight: 1.9, maxWidth: 640, marginBottom: 40,
              }}>
                James Clerk Maxwell resumió toda la electricidad y el magnetismo en cuatro ecuaciones.
                Lumyra las implementa directamente — cada banda de frecuencia del audio alimenta
                un parámetro físico diferente, y el campo visual responde en tiempo real.
              </p>
              <MaxwellCards />
            </Reveal>

            <Divider />

            {/* ── CÓMO FUNCIONA ─── */}
            <Reveal>
              <Label>cómo funciona</Label>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(28px, 4.5vw, 50px)',
                letterSpacing: '0.07em', marginBottom: 16, color: 'var(--text)',
              }}>
                DEL SONIDO AL CAMPO
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(14px, 1.8vw, 16px)', fontWeight: 300,
                color: 'var(--sub)', lineHeight: 1.9, maxWidth: 640, marginBottom: 36,
              }}>
                En cada frame (~16ms), el sistema analiza el espectro de la música
                y lo traduce en parámetros físicos del campo. El canvas reacciona
                instantáneamente al sonido usando la física real.
              </p>

              <PipelineDiagram />

              <div style={{ marginTop: 48, display: 'grid', gap: 32 }}>
                <EqCard
                  delay={0}
                  label="Transformada de Fourier — análisis espectral"
                  eq={'X(f) = Σₙ x(n) · e^(−j2πfn/N)'}
                  explain="El audio se descompone en sus frecuencias. A 44100 Hz con fftSize=2048, cada bin representa ~21.5 Hz. El browser lo calcula en tiempo real con el AnalyserNode."
                />
                <EqCard
                  delay={100}
                  label="Energía RMS — detección de beats"
                  eq={'E_rms(t) = √(1/N · Σ xᵢ²)\nbeat = E_rms(t) > 1.4 · media(historia)'}
                  explain="Se compara la energía del frame actual contra un promedio de los últimos ~700ms. Si supera el umbral 1.4×, es un beat — y el campo emite un pulso."
                />
                <EqCard
                  delay={200}
                  label="Campo eléctrico 2D — superposición de Coulomb"
                  eq={'E(p) = Σᵢ qᵢ · (p − rᵢ) / |p − rᵢ|'}
                  explain="En 2D el campo decae como 1/r en lugar de 1/r² (caso 3D). Cada fuente contribuye un vector. El campo total es la suma — principio de superposición."
                />
                <EqCard
                  delay={300}
                  label="Integración de Euler — líneas de campo"
                  eq={'p(n+1) = p(n) + normalize(E(p(n))) · Δs'}
                  explain="Las líneas de campo son curvas que siguen la dirección de E en cada punto. Se integran numéricamente paso a paso. Δs = 0.005 · maxSteps = 200."
                />
                <EqCard
                  delay={400}
                  label="Newton + Lorentz — dinámica de partículas"
                  eq={'a = q·E/m     v(t+1) = (v(t) + a·dt) · 0.98'}
                  explain="Cada partícula es una carga de prueba. La fuerza de Lorentz (componente eléctrica) la acelera. El factor 0.98 simula amortiguamiento — hay una velocidad terminal natural."
                />
              </div>
            </Reveal>

            <Divider />

            {/* ── MAPEO ESPECTRAL ─── */}
            <Reveal>
              <Label>mapeo espectral → campo electromagnético</Label>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(26px, 4vw, 46px)',
                letterSpacing: '0.07em', marginBottom: 16, color: 'var(--text)',
              }}>
                CADA FRECUENCIA<br />
                <span style={{ color: 'var(--teal)' }}>CONTROLA UNA VARIABLE FÍSICA</span>
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(14px, 1.8vw, 16px)', fontWeight: 300,
                color: 'var(--sub)', lineHeight: 1.9, maxWidth: 620, marginBottom: 36,
              }}>
                El espectro se divide en cinco bandas. Cada una alimenta un parámetro
                diferente de las ecuaciones de Maxwell — con suavizado temporal para
                evitar cambios bruscos: param(t) = 0.7·param(t−1) + 0.3·nuevo.
              </p>
              <BandsDiagram />
            </Reveal>

            <Divider />

            {/* ── STACK ─── */}
            <Reveal>
              <Label>stack técnico</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                {[
                  { name: 'Next.js 14',          role: 'framework' },
                  { name: 'TypeScript',           role: 'lenguaje' },
                  { name: 'Web Audio API',        role: 'análisis FFT' },
                  { name: 'Canvas 2D',            role: 'renderizado' },
                  { name: 'Zustand',              role: 'estado global' },
                  { name: 'rAF loop ~60fps',      role: 'animación' },
                ].map(({ name, role }) => (
                  <div key={name} style={{
                    padding: '15px 16px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.015)',
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--teal)', marginBottom: 4 }}>{name}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'var(--muted)' }}>{role}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Divider />

            {/* ── EL CREADOR ─── */}
            <Reveal>
              <Label>el creador</Label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'clamp(140px,25%,200px) 1fr',
                gap: 'clamp(24px, 5vw, 48px)',
                alignItems: 'start',
              }}>
                {/* Avatar */}
                <div style={{
                  border: '1px solid var(--border)',
                  background: 'rgba(5,5,8,0.7)',
                  aspectRatio: '1',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <img
                    src="/Axel.webp"
                    alt="atekokokoli"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '10px 12px',
                    background: 'rgba(5,5,8,0.92)',
                    borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: 'var(--text)', letterSpacing: '0.12em' }}>ATEKOKOKOLI</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--muted)', marginTop: 2 }}>indie dev · mx</div>
                  </div>
                </div>

                {/* Texto */}
                <div>
                  {/* Texto */}
                <div>
                  <h3 style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 'clamp(22px, 3.5vw, 38px)',
                    letterSpacing: '0.08em', lineHeight: 1.1,
                    marginBottom: 16, color: 'var(--text)',
                  }}>
                    UN PROYECTO<br />
                    <span style={{ color: 'var(--accent)' }}>INDEPENDIENTE</span>
                  </h3>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(13px, 1.6vw, 15px)', fontWeight: 300,
                    color: 'var(--sub)', lineHeight: 1.95, marginBottom: 14,
                  }}>
                    Lumyra nace de una obsesión personal con la física del electromagnetismo
                    y la música. No sé exactamente a dónde va esto, pero es algo que me importa
                    demasiado como para no hacerlo.
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(13px, 1.6vw, 15px)', fontWeight: 300,
                    color: 'rgba(232,230,224,0.4)', lineHeight: 1.95, marginBottom: 28,
                    fontStyle: 'italic',
                  }}>
                    Es un laboratorio abierto para artistas, programadores, músicos,
                    físicos y personas curiosas. El rumbo lo decide lo que resuena.
                  </p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href="https://github.com/AEUS-06" target="_blank" rel="noopener noreferrer" className="lum-link">github ↗</a>
                    <a href="https://www.linkedin.com/in/atkokoli/" target="_blank" rel="noopener noreferrer" className="lum-link">linkedin ↗</a>
                    <a href="https://www.instagram.com/atekokoli01?igsh=OXYyNndyang2NzA4" target="_blank" rel="noopener noreferrer" className="lum-link">instagram ↗</a>
                    <a href="https://www.tiktok.com/@atekokoli6?_r=1&_t=ZS-976z3KzXKgH" target="_blank" rel="noopener noreferrer" className="lum-link">tiktok ↗</a>
                  </div>
                </div>
                </div>
              </div>
            </Reveal>

            {/* ── CTA FINAL ─── */}
            <Reveal style={{ textAlign: 'center', paddingBottom: 40 }}>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(11px, 1.5vw, 14px)',
                color: 'var(--muted)', letterSpacing: '0.08em',
                fontStyle: 'italic', marginBottom: 44,
              }}>
                Si algo de esto resuena contigo, ya eres parte de él.
              </p>

              <EnterButton size="large" />

              <div style={{
                marginTop: 72, paddingTop: 28,
                borderTop: '1px solid var(--border)',
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 8.5, color: 'var(--muted)', letterSpacing: '0.22em',
                }}>
                  L U M Y R A &nbsp;·&nbsp; OPEN SOURCE &nbsp;·&nbsp; 2026
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </main>
    </>
  );
}