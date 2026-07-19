'use client';

// FieldCanvas — pipeline pictórico con doble buffer para fluidez.
//
// Truco UX de rendimiento:
// - Capa estática (líneas de campo): se dibuja en un OffscreenCanvas
//   cada 4 frames. Es costosa pero no necesita ser 60fps — el campo
//   cambia lento en relación a las partículas.
// - Capa dinámica (partículas, polvo, fuentes): se dibuja cada frame
//   sobre el buffer estático. Siempre a 60fps, siempre fluida.
//
// El usuario percibe el sistema como fluido porque el movimiento de
// las partículas nunca se interrumpe, aunque las líneas se actualicen
// a ~15fps. La persistencia retiniana hace el resto.

import { useEffect, useRef, useCallback } from 'react';
import { useLumyraStore } from '@/store';
import { useFieldEngine } from '@/hooks';
import { electricField, vec2 } from '@/lib';
import { Particle } from '@/lib';
import { FieldSource } from '@/store/types/field.types';
import { FieldParams } from '@/store/types/field.types';
import { AudioFrame } from '@/store/types/audio.types';
import {
  PIGMENT, rgba, fieldPigment,
  washFill, brushStroke, brushLine, oilStroke,
  benDayPattern, inkOutline, comicFrame,
  Ctx2D,
} from './pictoricUtils';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FlowParticle {
  x: number; y: number;
  age: number; maxAge: number;
  speed: number; intensity: number;
  size: number; charge: number;
}

interface PigmentDust {
  x: number; y: number;
  vx: number; vy: number;
  size: number; life: number;
  color: [number, number, number];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toX(n: number, W: number): number { return n * W; }
function toY(n: number, H: number): number { return n * H; }

// ─── Líneas de campo (capa estática — buffer offline) ────────────────────────

function paintFieldLines(
  ctx:     Ctx2D,
  W:       number,
  H:       number,
  sources: FieldSource[],
  beat:    number
): void {
  const pos = sources.filter(s => s.charge > 0);
  if (pos.length === 0) return;

  const linesPerSrc = 16;
  const steps       = 160;
  const stepSize    = 0.0042;
  const seedR       = 0.021;

  for (const src of pos) {
    for (let i = 0; i < linesPerSrc; i++) {
      const angle = (i / linesPerSrc) * Math.PI * 2;
      let px = src.position.x + Math.cos(angle) * seedR;
      let py = src.position.y + Math.sin(angle) * seedR;
      let prevX = toX(px, W);
      let prevY = toY(py, H);

      for (let s = 0; s < steps; s++) {
        const E   = electricField(vec2(px, py), sources);
        const mag = Math.sqrt(E.x * E.x + E.y * E.y);
        if (mag < 1e-7) break;

        px += (E.x / mag) * stepSize;
        py += (E.y / mag) * stepSize;

        if (px < -0.08 || px > 1.08 || py < -0.08 || py > 1.08) break;

        const neg = sources.find(s2 => s2.charge < 0);
        if (neg) {
          const dx = px - neg.position.x;
          const dy = py - neg.position.y;
          if (dx * dx + dy * dy < seedR * seedR * 1.6) break;
        }

        const intensity = src.intensity * Math.exp(-s / steps * 2.2);
        const pigment   = fieldPigment(intensity, beat * 0.4);
        const cx        = toX(px, W);
        const cy        = toY(py, H);

        brushLine(ctx, prevX, prevY, cx, cy, pigment,
          0.45 + intensity * 0.35,
          0.3 + intensity * 0.25
        );

        prevX = cx;
        prevY = cy;
      }
    }
  }
}

// ─── Flow particles ───────────────────────────────────────────────────────────

function spawnFlow(sources: FieldSource[], count: number, beat: number): FlowParticle[] {
  const result: FlowParticle[] = [];
  const pos = sources.filter(s => s.charge > 0);
  if (pos.length === 0) return result;
  const perSrc = Math.ceil(count / pos.length);
  for (const src of pos) {
    for (let i = 0; i < perSrc; i++) {
      const angle = (i / perSrc) * Math.PI * 2 + Math.random() * 0.4;
      const r     = 0.015 + Math.random() * 0.015;
      result.push({
        x: src.position.x + Math.cos(angle) * r,
        y: src.position.y + Math.sin(angle) * r,
        age: Math.floor(Math.random() * 40),
        maxAge: 90 + Math.floor(Math.random() * 130),
        speed: 0.0022 + Math.random() * 0.0022,
        intensity: src.intensity,
        size: 0.5 + Math.random() * 1.2 + beat * 0.8,
        charge: src.charge,
      });
    }
  }
  return result;
}

function stepFlow(p: FlowParticle, sources: FieldSource[]): FlowParticle {
  const E   = electricField(vec2(p.x, p.y), sources);
  const mag = Math.sqrt(E.x * E.x + E.y * E.y);
  if (mag < 1e-7) return { ...p, age: p.maxAge };
  return {
    ...p,
    x: p.x + (E.x / mag) * p.speed,
    y: p.y + (E.y / mag) * p.speed,
    age: p.age + 1,
    intensity: Math.min(mag * 1.6, 1),
  };
}

function drawFlowParticles(
  ctx:  Ctx2D,
  W:    number,
  H:    number,
  flow: FlowParticle[],
  beat: number
): void {
  for (const p of flow) {
    const lr    = p.age / p.maxAge;
    const alpha = Math.min(lr * 6, 1) * Math.pow(1 - lr, 0.5) * 0.65;
    if (alpha < 0.006) continue;
    const pigment = fieldPigment(p.intensity, beat);
    oilStroke(ctx, toX(p.x, W), toY(p.y, H), pigment,
      p.size * (1 + beat * 0.4), alpha);
  }
}

// ─── Partículas físicas ───────────────────────────────────────────────────────

function drawPhysicsParticles(
  ctx:       Ctx2D,
  W:         number,
  H:         number,
  particles: Particle[],
  beat:      number
): void {
  for (const p of particles) {
    const lr    = p.lifetime / p.maxLifetime;
    const alpha = Math.min(lr * 5, 1) * (1 - lr * lr) * 0.7;
    if (alpha < 0.006) continue;
    const pigment = p.charge > 0 ? PIGMENT.BLUE : PIGMENT.PURPLE;

    // Trail punteado alternando puntos
    for (let i = 0; i < p.trail.length; i += 2) {
      const t  = p.trail[i];
      const ta = alpha * (1 - i / p.trail.length) * 0.4;
      brushStroke(ctx, toX(t.x, W), toY(t.y, H), pigment,
        1.2 + (1 - i / p.trail.length) * 1.6, ta);
    }

    oilStroke(ctx, toX(p.position.x, W), toY(p.position.y, H), pigment,
      (2 + alpha * 2.5) * (1 + beat * 0.35), alpha);
  }
}

// ─── Fuentes de campo ─────────────────────────────────────────────────────────

function drawSources(
  ctx:     Ctx2D,
  W:       number,
  H:       number,
  sources: FieldSource[],
  beat:    number,
  time:    number
): void {
  for (const s of sources) {
    const x       = toX(s.position.x, W);
    const y       = toY(s.position.y, H);
    const pigment = s.charge > 0 ? PIGMENT.BLUE : PIGMENT.PURPLE;

    // Anillos de acuarela expansivos
    for (let i = 0; i < 4; i++) {
      const phase  = (time * 0.55 + i * 0.32) % 1;
      const radius = (16 + i * 20) * (1 + beat * 0.45) * phase;
      washFill(ctx, x, y, pigment, radius, (1 - phase) * 0.1 * s.intensity);
    }

    washFill(ctx, x, y, pigment, 28 + beat * 18, 0.13 * s.intensity);

    // Contorno de tinta
    inkOutline(ctx, x, y, 6 + beat * 4, 1.5);
    oilStroke(ctx, x, y, pigment, 5 + beat * 3.5, 0.9);

    // Centro blanco titanio
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = rgba(PIGMENT.WHITE, 0.85);
    ctx.fill();
  }
}

// ─── Viñeta waveform ──────────────────────────────────────────────────────────

function drawWaveformVignette(
  ctx:   Ctx2D,
  W:     number,
  H:     number,
  frame: AudioFrame | null
): void {
  if (!frame) return;
  const m  = 16;
  const fW = W - m * 2;
  const fH = 52;
  const fY = H - fH - m;

  comicFrame(ctx, m, fY, fW, fH, 0.8);

  const data  = frame.waveform;
  const midY  = fY + fH / 2;
  const scaleY = (fH / 2) * 0.72;
  const stepX  = fW / data.length;

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = m + i * stepX;
    const y = midY + data[i] * scaleY;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = rgba(PIGMENT.WHITE, 0.65);
  ctx.lineWidth   = 1;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(m, midY);
  ctx.lineTo(m + fW, midY);
  ctx.strokeStyle = rgba(PIGMENT.WHITE, 0.05);
  ctx.lineWidth   = 0.5;
  ctx.stroke();
}

// ─── Polvo de pigmento ────────────────────────────────────────────────────────

function spawnDust(W: number, H: number, energy: number, beat: number): PigmentDust[] {
  if (energy < 0.08 && beat < 0.08) return [];
  const count = Math.floor(energy * 3 + beat * 10);
  return Array.from({ length: count }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25 - 0.08,
    size: 0.3 + Math.random() * 0.7,
    life: 0.3 + Math.random() * 0.6,
    color: Math.random() > 0.5 ? PIGMENT.BLUE : PIGMENT.CYAN,
  }));
}

function updateAndDrawDust(
  ctx:    Ctx2D,
  dust:   PigmentDust[],
  W:      number,
  H:      number
): PigmentDust[] {
  const alive: PigmentDust[] = [];
  for (const d of dust) {
    d.x    += d.vx;
    d.y    += d.vy;
    d.vy   += 0.00006;
    d.life -= 0.004;
    if (d.life <= 0 || d.x < 0 || d.x > W || d.y < 0 || d.y > H) continue;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = rgba(d.color, d.life * 0.35);
    ctx.fill();
    alive.push(d);
  }
  return alive;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FieldCanvas() {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  // Buffer offline para las líneas de campo (capa costosa)
  const offscreenRef    = useRef<OffscreenCanvas | null>(null);
  const rafRef          = useRef<number | null>(null);
  const frameCountRef   = useRef(0);
  const beatRef         = useRef(0);
  const timeRef         = useRef(0);
  const energyRef       = useRef(0);
  const flowRef         = useRef<FlowParticle[]>([]);
  const dustRef         = useRef<PigmentDust[]>([]);
  const lastSrcKeyRef   = useRef('');

  const { particlesRef } = useFieldEngine();
  const beatDetected     = useLumyraStore((s) => s.beatDetected);

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

    frameCountRef.current++;
    beatRef.current  *= 0.88;
    timeRef.current  += 0.016;
    const beat   = beatRef.current;
    const time   = timeRef.current;
    const frame  = frameCountRef.current;

    const { fieldSources: sources, fieldParams, audioFrame } = useLumyraStore.getState();

    // Suavizar energía para evitar saltos bruscos
    energyRef.current = energyRef.current * 0.93 + fieldParams.E_magnitude * 0.07;
    const energy = energyRef.current;

    // ── Actualizar buffer offline de líneas cada 4 frames ──
    // Las líneas de campo cambian lento — no necesitan 60fps
    if (frame % 4 === 0 && sources.length > 0) {
      if (!offscreenRef.current ||
          offscreenRef.current.width !== W ||
          offscreenRef.current.height !== H) {
        offscreenRef.current = new OffscreenCanvas(W, H);
      }
      const offCtx = offscreenRef.current.getContext('2d');
      if (offCtx) {
        // Fondo del buffer offline
        offCtx.fillStyle = rgba(PIGMENT.BG, 0.15);
        offCtx.fillRect(0, 0, W, H);
        // Ben Day en baja energía
        if (energy < 0.4) {
          benDayPattern(offCtx, 0, 0, W, H, PIGMENT.BLUE,
            (0.4 - energy) * 0.022, 10, 1.0);
        }
        // Líneas de campo como pinceladas
        paintFieldLines(offCtx, W, H, sources, beat);
      }
    }

    // ── Canvas principal: fondo acuarela persistente ──
    ctx.fillStyle = rgba(PIGMENT.BG, 0.025 + energy * 0.015 + beat * 0.055);
    ctx.fillRect(0, 0, W, H);

    // ── Componer buffer de líneas (siempre fluido — solo se lee) ──
    if (offscreenRef.current) {
      ctx.globalAlpha = 0.92;
      ctx.drawImage(offscreenRef.current, 0, 0);
      ctx.globalAlpha = 1;
    }

    // ── Flow particles — siempre 60fps ──
    if (sources.length > 0) {
      const srcKey = sources.map(s => `${s.id}${s.position.x.toFixed(2)}`).join('|');
      if (srcKey !== lastSrcKeyRef.current || flowRef.current.length < 20) {
        const target = 55 + Math.floor(energy * 35);
        flowRef.current = spawnFlow(sources, target, beat);
        lastSrcKeyRef.current = srcKey;
      }

      const negSrc = sources.find(s => s.charge < 0);
      flowRef.current = flowRef.current
        .map(p => stepFlow(p, sources))
        .filter(p => {
          if (p.x < -0.08 || p.x > 1.08 || p.y < -0.08 || p.y > 1.08) return false;
          if (p.age >= p.maxAge) return false;
          if (negSrc) {
            const dx = p.x - negSrc.position.x;
            const dy = p.y - negSrc.position.y;
            if (dx * dx + dy * dy < 0.0003) return false;
          }
          return true;
        });

      const target = 55 + Math.floor(energy * 35);
      if (flowRef.current.length < target * 0.55) {
        flowRef.current.push(...spawnFlow(sources, target - flowRef.current.length, beat));
      }

      drawFlowParticles(ctx, W, H, flowRef.current, beat);
    }

    // ── Partículas físicas — siempre 60fps ──
    drawPhysicsParticles(ctx, W, H, particlesRef.current, beat);

    // ── Fuentes de campo — ligeras, siempre 60fps ──
    if (sources.length > 0) {
      drawSources(ctx, W, H, sources, beat, time);
    }

    // ── Viñeta waveform ──
    drawWaveformVignette(ctx, W, H, audioFrame);

    // ── Polvo de pigmento ──
    dustRef.current.push(...spawnDust(W, H, energy, beat));
    if (dustRef.current.length > 180) dustRef.current = dustRef.current.slice(-180);
    dustRef.current = updateAndDrawDust(ctx, dustRef.current, W, H);

    rafRef.current = requestAnimationFrame(render);
  }, [particlesRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      // Invalidar buffer offline al cambiar tamaño
      offscreenRef.current = null;
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
        style={{ display: 'block', width: '100%', height: '100%', background: '#0d0d0d' }}
      />
    </div>
  );
}