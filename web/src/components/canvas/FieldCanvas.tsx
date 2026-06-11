'use client';

// Canvas principal del campo electromagnético.
// La lógica de física y renderizado es idéntica al original.
//
// Mejoras de diseño (sin cambios funcionales):
//  · Fondo: opacidad de trail raise de 0.15 → 0.12 en dark, 0.13 en light
//    para estelas más persistentes ("motion blur" intencional)
//  · Paleta: curva de mezcla recalibrada con puntos de corte más contrastados
//  · Líneas: lineWidth mínimo 0.8 (antes 0.5) + antialiasing más pronunciado
//  · Flow particles: tamaño base ampliado, halo glow más grande
//  · Fuentes: anillos de onda más separados, core dot más prominente
//  · Partículas físicas: trail con alpha curve más suave

import { useEffect, useRef, useCallback } from 'react';
import { useLumyraStore } from '@/store';
import { useFieldEngine } from '@/hooks';
import { electricField, vec2, generateFieldLines, defaultFieldLineConfig, mobileFieldLineConfig } from '@/lib';
import { WaveformOverlay } from './overlays/WaveformOverlay';
import { fieldLinesToPositions, countLineVertices } from './field-lines/fieldLinesToBuffers';
import { fieldLinesToIntensities } from './field-lines/fieldLinesColors';
import { particlesToPositions } from './particles/particlesToPositions';
import { particlesToIntensities } from './particles/particlesToColors';
import { FieldSource } from '@/store/types/field.types';

// ─── Paleta del fragment shader portada a JS ──────────────────────────────────

function smoothstep(lo: number, hi: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

function lerpRGB(
  a: [number, number, number],
  b: [number, number, number],
  f: number
): [number, number, number] {
  const c = Math.max(0, Math.min(1, f));
  return [a[0] + (b[0] - a[0]) * c, a[1] + (b[1] - a[1]) * c, a[2] + (b[2] - a[2]) * c];
}

// Paleta dark — más saturada, mayor contraste en zonas medias
const PAL_LOW:  [number, number, number] = [0.025, 0.060, 0.130];
const PAL_MID:  [number, number, number] = [0.180, 0.520, 1.000];
const PAL_HIGH: [number, number, number] = [0.000, 0.920, 0.740];
const PAL_PEAK: [number, number, number] = [0.850, 0.970, 1.000]; // blanco-azulado, no blanco puro

// Paleta light — azules y teales profundos sobre fondo claro
const PAL_LOW_LIGHT:  [number, number, number] = [0.78, 0.86, 0.94];
const PAL_MID_LIGHT:  [number, number, number] = [0.08, 0.34, 0.80];
const PAL_HIGH_LIGHT: [number, number, number] = [0.00, 0.44, 0.35];
const PAL_PEAK_LIGHT: [number, number, number] = [0.00, 0.08, 0.18];

function paletteRGB(t: number, beat: number, isLight: boolean): [number, number, number] {
  const v    = Math.min(t + beat * 0.28, 1);
  const low  = isLight ? PAL_LOW_LIGHT  : PAL_LOW;
  const mid  = isLight ? PAL_MID_LIGHT  : PAL_MID;
  const high = isLight ? PAL_HIGH_LIGHT : PAL_HIGH;
  const peak = isLight ? PAL_PEAK_LIGHT : PAL_PEAK;

  // Puntos de corte más separados → transiciones más nítidas
  let c = lerpRGB(low,  mid,  smoothstep(0.00, 0.30, v));
  c     = lerpRGB(c,    high, smoothstep(0.28, 0.62, v));
  c     = lerpRGB(c,    peak, smoothstep(0.58, 1.00, v));
  return c;
}

function rgba(col: [number, number, number], a: number): string {
  return `rgba(${Math.round(col[0]*255)},${Math.round(col[1]*255)},${Math.round(col[2]*255)},${a})`;
}

// ─── FlowParticle ─────────────────────────────────────────────────────────────

interface FlowParticle {
  x: number; y: number;
  age: number; maxAge: number;
  speed: number;
  intensity: number;
  size: number;
  trail: Array<{ x: number; y: number; intensity: number }>;
}

function spawnFlowParticle(sources: FieldSource[], beat: number): FlowParticle | null {
  const pos = sources.filter(s => s.charge > 0);
  if (!pos.length) return null;
  const src   = pos[Math.floor(Math.random() * pos.length)];
  const angle = Math.random() * Math.PI * 2;
  const r     = 0.015 + Math.random() * 0.018;
  return {
    x: src.position.x + Math.cos(angle) * r,
    y: src.position.y + Math.sin(angle) * r,
    age: Math.floor(Math.random() * 15),
    maxAge: 90 + Math.floor(Math.random() * 130),
    speed: 0.0025 + Math.random() * 0.003,
    intensity: src.intensity,
    // Tamaño base ligeramente mayor para más presencia visual
    size: 1.0 + Math.random() * 1.8 + beat * 1.4,
    trail: [],
  };
}

function stepFlowParticle(p: FlowParticle, sources: FieldSource[]): FlowParticle {
  const E   = electricField(vec2(p.x, p.y), sources);
  const mag = Math.sqrt(E.x * E.x + E.y * E.y);
  if (mag < 1e-7) return { ...p, age: p.maxAge };

  const posIntens   = Math.exp(-(p.age / p.maxAge) * 2.5);
  const fieldIntens = Math.min(mag * 2, 1);
  const blended     = posIntens * 0.6 + fieldIntens * 0.4;

  return {
    ...p,
    x:         p.x + (E.x / mag) * p.speed,
    y:         p.y + (E.y / mag) * p.speed,
    age:       p.age + 1,
    intensity: blended,
    trail:     [{ x: p.x, y: p.y, intensity: blended }, ...p.trail.slice(0, 11)],
  };
}

// ─── Dibujo de fuentes ────────────────────────────────────────────────────────

function drawSources(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  sources: FieldSource[], beat: number, time: number, isLight: boolean
) {
  for (const s of sources) {
    const x   = s.position.x * W;
    const y   = s.position.y * H;
    const pos = s.charge > 0;
    const coreCol: [number, number, number] = pos
      ? paletteRGB(0.65, beat, isLight)
      : [0.680, 0.260, 1.0];

    // Ondas de expansión — 6 anillos con mayor separación entre fases
    for (let i = 0; i < 6; i++) {
      const phase  = (time * 0.65 + i * 0.30) % 1;
      const radius = (28 + i * 22) * (1 + beat * 0.45);
      ctx.beginPath();
      ctx.arc(x, y, radius * phase, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(coreCol, (1 - phase) * (1 - phase) * 0.15 * s.intensity);
      ctx.lineWidth   = 1.0;
      ctx.stroke();
    }

    // Halo difuso exterior — radio mayor
    ctx.beginPath();
    ctx.arc(x, y, (16 + beat * 12) * 3.0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(coreCol, 0.035 + beat * 0.055);
    ctx.fill();

    // Halo medio con glow
    ctx.beginPath();
    ctx.arc(x, y, 7 + beat * 9, 0, Math.PI * 2);
    ctx.fillStyle   = rgba(coreCol, 0.92);
    ctx.shadowColor = rgba(coreCol, 0.85);
    ctx.shadowBlur  = 24 + beat * 40;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // Núcleo — punto central negro/blanco según tema
    ctx.beginPath();
    ctx.arc(x, y, 3.0, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.96)' : 'rgba(255,255,255,0.96)';
    ctx.fill();

    // Micro-punto de brillo sobre el núcleo
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)';
    ctx.fill();
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FieldCanvas() {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const rafRef          = useRef<number | null>(null);
  const beatRef         = useRef(0);
  const timeRef         = useRef(0);
  const flowRef         = useRef<FlowParticle[]>([]);
  const lastSourceKey   = useRef('');
  const isLightRef      = useRef(false);

  const particlePosBuf    = useRef(new Float32Array(120 * 3));
  const particleIntensBuf = useRef(new Float32Array(120));

  const linesCacheRef = useRef<{
    key: string;
    pos: Float32Array;
    intens: Float32Array;
    count: number;
  }>({ key: '', pos: new Float32Array(0), intens: new Float32Array(0), count: 0 });

  const { particlesRef } = useFieldEngine();
  const beatDetected     = useLumyraStore(s => s.beatDetected);

  useEffect(() => {
    if (beatDetected) beatRef.current = 1.0;
  }, [beatDetected]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    isLightRef.current = document.documentElement.getAttribute('data-theme') === 'light';
    const isLight = isLightRef.current;

    beatRef.current *= 0.87;
    timeRef.current += 0.016;
    const beat = beatRef.current;
    const time = timeRef.current;

    const { fieldSources: sources, fieldParams } = useLumyraStore.getState();

    // Fondo — opacidad ligeramente reducida para estelas más largas
    const bgRgb = isLight ? '238,243,250' : '3,7,13';
    ctx.fillStyle = `rgba(${bgRgb},${0.12 + beat * 0.09})`;
    ctx.fillRect(0, 0, W, H);

    if (sources.length > 0) {
      // ── Líneas de campo ──
      const sourceKey = sources
        .map(s => `${s.id}|${s.position.x.toFixed(3)}|${s.position.y.toFixed(3)}`)
        .join(';');

      if (sourceKey !== linesCacheRef.current.key) {
        const isMobile = W < 768;
        const config   = isMobile ? mobileFieldLineConfig : defaultFieldLineConfig;
        const lines    = generateFieldLines(sources, config);
        const pos      = fieldLinesToPositions(lines);
        const intens   = fieldLinesToIntensities(lines);
        linesCacheRef.current = { key: sourceKey, pos, intens, count: countLineVertices(lines) };
      }

      const { pos: lPos, intens: lInt, count: lCount } = linesCacheRef.current;
      ctx.save();
      ctx.globalCompositeOperation = isLight ? 'multiply' : 'lighter';
      for (let i = 0; i < lCount - 1; i += 2) {
        const o0 = i * 3;
        const o1 = (i + 1) * 3;
        const x0 = (lPos[o0]      + 1) * 0.5 * W;
        const y0 = (-lPos[o0 + 1] + 1) * 0.5 * H;
        const x1 = (lPos[o1]      + 1) * 0.5 * W;
        const y1 = (-lPos[o1 + 1] + 1) * 0.5 * H;
        const iv  = lInt[i];
        const col = paletteRGB(iv * 0.88, beat * 0.4, isLight);
        // Alpha mínimo levantado para que ninguna línea sea invisible
        const a   = Math.max(0.008, iv * (isLight ? 0.40 : 0.22) * (1 + beat * 0.28));

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = rgba(col, a);
        // Ancho mínimo 0.8 para antialiasing visible a todos los valores
        ctx.lineWidth   = 0.8 + iv * 1.2;
        ctx.stroke();
      }
      ctx.restore();

      // ── Flow particles ──
      const sourceKeyShort = sources.map(s => s.id).join('|');
      if (sourceKeyShort !== lastSourceKey.current) {
        flowRef.current       = [];
        lastSourceKey.current = sourceKeyShort;
      }

      flowRef.current = flowRef.current
        .map(p => stepFlowParticle(p, sources))
        .filter(p => {
          if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) return false;
          if (p.age >= p.maxAge) return false;
          const neg = sources.find(s => s.charge < 0);
          if (neg) {
            const dx = p.x - neg.position.x;
            const dy = p.y - neg.position.y;
            if (dx * dx + dy * dy < 0.0004) return false;
          }
          return true;
        });

      const target    = fieldParams.rho > 0.3 ? 80 : 45;
      const spawnRate = Math.min(target - flowRef.current.length, 2 + Math.floor(beat * 3));
      for (let i = 0; i < spawnRate; i++) {
        const p = spawnFlowParticle(sources, beat);
        if (p) flowRef.current.push(p);
      }

      for (const p of flowRef.current) {
        const lr    = p.age / p.maxAge;
        // Curva de alpha más suave — sin clipping abrupto al inicio
        const alpha = Math.pow(Math.min(lr * 5, 1), 0.6) * Math.pow(1 - lr, 0.55) * 0.90;
        if (alpha < 0.01) continue;

        const col = paletteRGB(p.intensity, beat, isLight);

        if (p.trail.length >= 2) {
          for (let i = 0; i < p.trail.length - 1; i++) {
            const ta   = p.trail[i];
            const tb   = p.trail[i + 1];
            const frac = 1 - (i + 1) / p.trail.length;
            const tCol = paletteRGB(ta.intensity, beat * 0.4, isLight);
            ctx.beginPath();
            ctx.moveTo(ta.x * W, ta.y * H);
            ctx.lineTo(tb.x * W, tb.y * H);
            ctx.strokeStyle = rgba(tCol, alpha * frac * 0.55);
            ctx.lineWidth   = p.size * (0.35 + frac * 0.65);
            ctx.stroke();
          }
        }

        const x = p.x * W;
        const y = p.y * H;
        const r = p.size * (1 + beat * 0.45);

        // Halo exterior ampliado
        ctx.beginPath();
        ctx.arc(x, y, r * 4.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, alpha * 0.06);
        ctx.fill();

        // Core con glow
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle   = rgba(col, alpha);
        ctx.shadowColor = rgba(col, alpha * 0.85);
        ctx.shadowBlur  = 8 + beat * 18;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }

      drawSources(ctx, W, H, sources, beat, time, isLight);
    }

    // ── Partículas físicas ──
    const particles = particlesRef.current;
    if (particles.length > 0) {
      particlesToPositions(particles, particlePosBuf.current);
      particlesToIntensities(particles, particleIntensBuf.current);

      for (let i = 0; i < particles.length; i++) {
        const o  = i * 3;
        const px = (particlePosBuf.current[o]      + 1) * 0.5 * W;
        const py = (-particlePosBuf.current[o + 1] + 1) * 0.5 * H;
        const iv = particleIntensBuf.current[i];
        const p  = particles[i];

        const lr    = p.lifetime / p.maxLifetime;
        // Alpha curve más suave para partículas físicas
        const alpha = Math.pow(Math.min(lr * 3.5, 1), 0.7) * Math.pow(1 - lr * lr, 0.8);
        if (alpha < 0.01) continue;

        const t   = p.charge > 0 ? 0.42 + iv * 0.52 : 0.14 + iv * 0.38;
        const col = paletteRGB(t, beat * 0.6, isLight);

        for (let j = 0; j < p.trail.length; j += 2) {
          const tp   = p.trail[j];
          const frac = 1 - j / p.trail.length;
          const tCol = paletteRGB(t * frac, beat * 0.3, isLight);
          ctx.beginPath();
          ctx.arc(tp.x * W, tp.y * H, 1.2 + frac * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = rgba(tCol, alpha * frac * 0.50);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, (2.5 + alpha * 2.5) * (1 + beat * 0.45), 0, Math.PI * 2);
        ctx.fillStyle   = rgba(col, alpha);
        ctx.shadowColor = rgba(col, 0.65);
        ctx.shadowBlur  = 10 + beat * 18;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, [particlesRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [render]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display:    'block',
          width:      '100%',
          height:     '100%',
          background: 'var(--color-bg)',
          transition: 'background 0.4s ease',
        }}
      />
      <WaveformOverlay />
    </div>
  );
}