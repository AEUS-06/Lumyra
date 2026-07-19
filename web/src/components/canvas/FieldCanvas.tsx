'use client';

// FieldCanvas — el lienzo de Lumyra.
//
// Responsabilidad única: orquestar el pipeline de renderizado.
// No calcula física, no simula partículas, no pinta directamente —
// todo eso vive en los dominios importados (background/, field/, particles/, waveform/).
//
// Gestiona tres cosas propias del componente:
// 1. El ciclo de vida del canvas HTML (resize, mount, unmount)
// 2. El buffer offline de líneas de campo (optimización de rendimiento)
// 3. El loop de requestAnimationFrame que invoca cada dominio en orden
//
// Estrategia de rendimiento — doble buffer:
// Las líneas de campo (field/drawFieldLines) son la operación más costosa
// del pipeline porque integran numéricamente decenas de trayectorias.
// Se recalculan solo cada 4 frames en un OffscreenCanvas; en los frames
// intermedios simplemente se copia ese buffer con drawImage(), que es
// prácticamente gratis. El resto de capas (partículas, fuentes, waveform)
// se pintan siempre a 60fps — son las que dan la sensación de fluidez.

import { useEffect, useRef, useCallback } from 'react';
import { useLumyraStore } from '@/store';
import { useFieldEngine } from '@/hooks';
import { rgba, BG } from './pictoric';
import { drawBackground, drawBenDay } from './background';
import { drawFieldLines, drawSources } from './field';
import {
  FlowParticle, DustParticle,
  updateFlowParticles, updateDustParticles,
  drawFlowParticles, drawPhysicsParticles, drawDust,
} from './particles';
import { drawWaveform } from './waveform';
import { benDayPattern } from './pictoric';

export function FieldCanvas() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const offscreenRef  = useRef<OffscreenCanvas | null>(null);
  const rafRef        = useRef<number | null>(null);

  const frameCountRef = useRef(0);
  const beatRef       = useRef(0);
  const timeRef       = useRef(0);
  const energyRef     = useRef(0);

  const flowRef       = useRef<FlowParticle[]>([]);
  const dustRef       = useRef<DustParticle[]>([]);
  const lastSrcKeyRef = useRef('');

  const { particlesRef } = useFieldEngine();
  const beatDetected      = useLumyraStore((s) => s.beatDetected);

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
    beatRef.current *= 0.88;
    timeRef.current += 0.016;

    const beat  = beatRef.current;
    const time  = timeRef.current;
    const frame = frameCountRef.current;

    const { fieldSources: sources, fieldParams, audioFrame } = useLumyraStore.getState();

    // Suavizar energía para evitar saltos bruscos entre frames de audio
    energyRef.current = energyRef.current * 0.93 + fieldParams.E_magnitude * 0.07;
    const energy = energyRef.current;

    // ── Buffer offline de líneas de campo — se actualiza cada 4 frames ──
    if (frame % 4 === 0 && sources.length > 0) {
      if (!offscreenRef.current ||
          offscreenRef.current.width !== W ||
          offscreenRef.current.height !== H) {
        offscreenRef.current = new OffscreenCanvas(W, H);
      }
      const offCtx = offscreenRef.current.getContext('2d');
      if (offCtx) {
        offCtx.fillStyle = rgba(BG, 0.15);
        offCtx.fillRect(0, 0, W, H);
        if (energy < 0.4) {
          benDayPattern(offCtx, 0, 0, W, H, [0.22, 0.45, 0.95], (0.4 - energy) * 0.022, 10, 1.0);
        }
        drawFieldLines(offCtx, W, H, sources, beat);
      }
    }

    // ── Canvas principal: fondo acuarela persistente ──
    drawBackground(ctx, W, H, energy, beat);

    // ── Trama Ben Day directamente en el canvas principal cuando no hay fuentes ──
    if (sources.length === 0) {
      drawBenDay(ctx, W, H, energy);
    }

    // ── Componer el buffer de líneas — operación barata (drawImage) ──
    if (offscreenRef.current) {
      ctx.globalAlpha = 0.92;
      ctx.drawImage(offscreenRef.current, 0, 0);
      ctx.globalAlpha = 1;
    }

    // ── Flow particles — siempre 60fps ──
    if (sources.length > 0) {
      const srcKey = sources.map((s) => `${s.id}${s.position.x.toFixed(2)}`).join('|');
      const target = 55 + Math.floor(energy * 35);

      if (srcKey !== lastSrcKeyRef.current || flowRef.current.length < 20) {
        lastSrcKeyRef.current = srcKey;
      }

      flowRef.current = updateFlowParticles(flowRef.current, sources, target, beat);
      drawFlowParticles(ctx, W, H, flowRef.current, beat);
    }

    // ── Partículas físicas — siempre 60fps ──
    drawPhysicsParticles(ctx, W, H, particlesRef.current, beat);

    // ── Fuentes de campo ──
    if (sources.length > 0) {
      drawSources(ctx, W, H, sources, beat, time);
    }

    // ── Viñeta waveform ──
    drawWaveform(ctx, W, H, audioFrame);

    // ── Polvo de pigmento ──
    dustRef.current = updateDustParticles(dustRef.current, W, H, energy, beat);
    drawDust(ctx, dustRef.current);

    rafRef.current = requestAnimationFrame(render);
  }, [particlesRef]);

  // Resize — invalida el buffer offline para forzar repintado completo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      offscreenRef.current = null;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Loop principal
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
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