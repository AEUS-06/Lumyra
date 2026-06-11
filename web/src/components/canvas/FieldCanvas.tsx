'use client';

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
// Mismos 4 stops que fieldPalette() en shaders/index.ts

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

const PAL_LOW:  [number, number, number] = [0.039, 0.086, 0.157];
const PAL_MID:  [number, number, number] = [0.227, 0.561, 1.000];
const PAL_HIGH: [number, number, number] = [0.000, 0.941, 0.753];
const PAL_PEAK: [number, number, number] = [1.000, 1.000, 1.000];

function paletteRGB(t: number, beat: number): [number, number, number] {
  const v = Math.min(t + beat * 0.25, 1);
  let c   = lerpRGB(PAL_LOW,  PAL_MID,  smoothstep(0.0, 0.35, v));
  c       = lerpRGB(c,        PAL_HIGH, smoothstep(0.3, 0.65, v));
  c       = lerpRGB(c,        PAL_PEAK, smoothstep(0.6, 1.00, v));
  return c;
}

function rgba(col: [number, number, number], a: number): string {
  return `rgba(${Math.round(col[0]*255)},${Math.round(col[1]*255)},${Math.round(col[2]*255)},${a})`;
}

// ─── FlowParticle — sigue líneas de campo con trail ───────────────────────────

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
    size: 0.7 + Math.random() * 1.6 + beat * 1.2,
    trail: [],
  };
}

function stepFlowParticle(p: FlowParticle, sources: FieldSource[]): FlowParticle {
  const E   = electricField(vec2(p.x, p.y), sources);
  const mag = Math.sqrt(E.x * E.x + E.y * E.y);
  if (mag < 1e-7) return { ...p, age: p.maxAge };

  // intensityByPosition desde fieldLinesColors.ts — mismo decaimiento exponencial
  const posIntens   = Math.exp(-(p.age / p.maxAge) * 2.5);
  const fieldIntens = Math.min(mag * 2, 1);
  const blended     = posIntens * 0.6 + fieldIntens * 0.4;

  return {
    ...p,
    x:         p.x + (E.x / mag) * p.speed,
    y:         p.y + (E.y / mag) * p.speed,
    age:       p.age + 1,
    intensity: blended,
    trail:     [{ x: p.x, y: p.y, intensity: blended }, ...p.trail.slice(0, 9)],
  };
}

// ─── Dibujo de fuentes ────────────────────────────────────────────────────────

function drawSources(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  sources: FieldSource[], beat: number, time: number
) {
  for (const s of sources) {
    const x   = s.position.x * W;
    const y   = s.position.y * H;
    const pos = s.charge > 0;
    // Positivo → paleta mid (azul); negativo → violeta fuera de paleta
    const coreCol: [number, number, number] = pos
      ? paletteRGB(0.6, beat)
      : [0.706, 0.314, 1.0];

    // Anillos pulsantes — 5 capas con phase offset
    for (let i = 0; i < 5; i++) {
      const phase  = (time * 0.7 + i * 0.35) % 1;
      const radius = (22 + i * 18) * (1 + beat * 0.4);
      ctx.beginPath();
      ctx.arc(x, y, radius * phase, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(coreCol, (1 - phase) * 0.12 * s.intensity);
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    // Glow exterior
    ctx.beginPath();
    ctx.arc(x, y, (12 + beat * 10) * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = rgba(coreCol, 0.04 + beat * 0.06);
    ctx.fill();

    // Núcleo
    ctx.beginPath();
    ctx.arc(x, y, 5 + beat * 7, 0, Math.PI * 2);
    ctx.fillStyle   = rgba(coreCol, 0.9);
    ctx.shadowColor = rgba(coreCol, 0.8);
    ctx.shadowBlur  = 20 + beat * 35;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // Centro blanco
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FieldCanvas() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rafRef         = useRef<number | null>(null);
  const beatRef        = useRef(0);
  const timeRef        = useRef(0);
  const flowRef        = useRef<FlowParticle[]>([]);
  const lastSourceKey  = useRef('');

  // Buffers pre-alocados — sin allocs dentro del RAF
  const particlePosBuf   = useRef(new Float32Array(120 * 3));
  const particleIntensBuf = useRef(new Float32Array(120));

  // Cache de geometría de líneas de campo — se recalcula solo al cambiar fuentes
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

    beatRef.current *= 0.87;
    timeRef.current += 0.016;
    const beat = beatRef.current;
    const time = timeRef.current;

    const { fieldSources: sources, fieldParams } = useLumyraStore.getState();

    // Fondo con motion trail — más opaco en beat para flash sutil
    ctx.fillStyle = `rgba(4,9,15,${0.15 + beat * 0.10})`;
    ctx.fillRect(0, 0, W, H);

    if (sources.length > 0) {
      // ── Líneas de campo estáticas ──
      // Usa generateFieldLines + fieldLinesToPositions + fieldLinesToIntensities
      // (las mismas funciones de useFieldLinesUpdate — solo cambia que las leemos en 2D)
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

      // Dibujar segmentos — pos en espacio Three [-1,1] → canvas [0,W/H]
      const { pos: lPos, intens: lInt, count: lCount } = linesCacheRef.current;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < lCount - 1; i += 2) {
        const o0 = i * 3;
        const o1 = (i + 1) * 3;
        const x0 = (lPos[o0]      + 1) * 0.5 * W;
        const y0 = (-lPos[o0 + 1] + 1) * 0.5 * H;
        const x1 = (lPos[o1]      + 1) * 0.5 * W;
        const y1 = (-lPos[o1 + 1] + 1) * 0.5 * H;
        const iv  = lInt[i];
        const col = paletteRGB(iv * 0.85, beat * 0.4);
        const a   = iv * 0.20 * (1 + beat * 0.25);
        if (a < 0.005) continue;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = rgba(col, a);
        ctx.lineWidth   = 0.5 + iv * 1.0;
        ctx.stroke();
      }
      ctx.restore();

      // ── Partículas de flujo ──
      // Reposición gradual: 1-3 por frame, nunca en batch
      const sourceKeyShort = sources.map(s => s.id).join('|');
      if (sourceKeyShort !== lastSourceKey.current) {
        flowRef.current    = [];
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

      // Dibujar flow particles con trail como línea continua + glow
      for (const p of flowRef.current) {
        const lr    = p.age / p.maxAge;
        const alpha = Math.min(lr * 6, 1) * Math.pow(1 - lr, 0.5) * 0.88;
        if (alpha < 0.01) continue;

        const col = paletteRGB(p.intensity, beat);

        // Trail como polyline continua
        if (p.trail.length >= 2) {
          for (let i = 0; i < p.trail.length - 1; i++) {
            const ta   = p.trail[i];
            const tb   = p.trail[i + 1];
            const frac = 1 - (i + 1) / p.trail.length;
            const tCol = paletteRGB(ta.intensity, beat * 0.4);
            ctx.beginPath();
            ctx.moveTo(ta.x * W, ta.y * H);
            ctx.lineTo(tb.x * W, tb.y * H);
            ctx.strokeStyle = rgba(tCol, alpha * frac * 0.5);
            ctx.lineWidth   = p.size * (0.3 + frac * 0.7);
            ctx.stroke();
          }
        }

        // Glow exterior difuso
        const x = p.x * W;
        const y = p.y * H;
        const r = p.size * (1 + beat * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, alpha * 0.07);
        ctx.fill();

        // Núcleo brillante
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle   = rgba(col, alpha);
        ctx.shadowColor = rgba(col, alpha * 0.8);
        ctx.shadowBlur  = 6 + beat * 14;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }

      // ── Fuentes ──
      drawSources(ctx, W, H, sources, beat, time);
    }

    // ── Partículas físicas ──
    // Usa particlesToPositions + particlesToIntensities (misma lógica que ParticleSystem.tsx)
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
        const alpha = Math.min(lr * 4, 1) * (1 - lr * lr);
        if (alpha < 0.01) continue;

        const t   = p.charge > 0 ? 0.4 + iv * 0.5 : 0.15 + iv * 0.35;
        const col = paletteRGB(t, beat * 0.6);

        // Trail punteado usando los puntos del array p.trail
        for (let j = 0; j < p.trail.length; j += 2) {
          const tp   = p.trail[j];
          const frac = 1 - j / p.trail.length;
          const tCol = paletteRGB(t * frac, beat * 0.3);
          ctx.beginPath();
          ctx.arc(tp.x * W, tp.y * H, 1 + frac * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = rgba(tCol, alpha * frac * 0.45);
          ctx.fill();
        }

        // Punto principal
        ctx.beginPath();
        ctx.arc(px, py, (2 + alpha * 2) * (1 + beat * 0.4), 0, Math.PI * 2);
        ctx.fillStyle   = rgba(col, alpha);
        ctx.shadowColor = rgba(col, 0.6);
        ctx.shadowBlur  = 8 + beat * 15;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, [particlesRef]);

  // Resize
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

  // Loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [render]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', background: '#04090f' }}
      />
      {/* WaveformOverlay mantiene su propio canvas 2D separado — no compite con el RAF */}
      <WaveformOverlay />
    </div>
  );
}