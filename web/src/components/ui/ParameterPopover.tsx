'use client';

// Panel flotante con información física de un parámetro.
//
// Responsabilidad única: renderizar el contenido educativo, gestionar
// su cierre, y animar tanto su entrada como su salida — `isOpen` decide
// qué keyframe usar. El padre (ParameterValue) mantiene este componente
// montado unos milisegundos extra tras cerrarse para que la animación
// de salida alcance a completarse antes de desmontar.

import { useEffect, useRef, useState } from 'react';
import { useLumyraStore } from '@/store';
import { FormattedParameter } from './hooks/useParameterFormat';
import { getParameterInfo } from './parameterPhysicsInfo';
import { ParameterIllustration } from './ParameterIllustration';

interface ParameterPopoverProps {
  parameter:   FormattedParameter;
  anchorRect:  { left: number; top: number; width: number };
  accentColor: string;
  isOpen:      boolean;
  onClose:     () => void;
}

export function ParameterPopover({ parameter, anchorRect, accentColor, isOpen, onClose }: ParameterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const info = getParameterInfo(parameter.symbol);
  const audioPlaying = useLumyraStore((s) => s.audioPlaying);
  const beatDetected = useLumyraStore((s) => s.beatDetected);

  const [beatKey, setBeatKey] = useState(0);
  useEffect(() => {
    if (beatDetected) setBeatKey((k) => k + 1);
  }, [beatDetected]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const popoverWidth = 260;
  const left = Math.min(
    Math.max(8, anchorRect.left + anchorRect.width / 2 - popoverWidth / 2),
    window.innerWidth - popoverWidth - 8
  );

  return (
    <div
      ref={popoverRef}
      style={{
        position:   'fixed',
        left,
        bottom:     window.innerHeight - anchorRect.top + 10,
        width:      popoverWidth,
        background: 'var(--color-bg-surface)',
        border:     `1px solid ${accentColor}`,
        boxShadow:  'var(--shadow-panel)',
        padding:    14,
        zIndex:     100,
        // Entrada: fade-slide-in. Salida: fade-slide-out. La duración de
        // salida coincide con CLOSE_ANIMATION_MS en ParameterValue.tsx.
        animation:  isOpen ? 'fade-slide-in 0.2s ease both' : 'fade-slide-out 0.18s ease both',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: accentColor }}>
          {parameter.symbol}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {info.fullName}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-primary)', marginBottom: 10, letterSpacing: '0.02em' }}>
        {info.formula}
      </div>

      <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', marginBottom: 10, overflow: 'hidden' }}>
        <ParameterIllustration
          type={info.illustration}
          color={accentColor}
          rawValue={parameter.rawValue}
          isReactive={audioPlaying}
          beatKey={beatKey}
        />
      </div>

      <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, lineHeight: 1.55, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
        {info.description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {audioPlaying ? 'reactivo a la música' : 'valor actual'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: accentColor }}>
          {parameter.value}
        </span>
      </div>
    </div>
  );
}