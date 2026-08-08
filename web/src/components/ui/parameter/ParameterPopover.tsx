'use client';

// Panel flotante con información física de un parámetro.
//
// Responsabilidad única: componer PopoverHeader, PopoverFormula,
// ParameterIllustration, PopoverDescription y PopoverValueRow, gestionar
// su cierre (useDismissable) y trackear beats para el pulso visual.
// No calcula ni dibuja nada por sí mismo — todo vive en las piezas.

import { useEffect, useRef, useState } from 'react';
import { useLumyraStore } from '@/store';
import { FormattedParameter, useDismissable } from '../hooks';
import { ParameterIllustration, getParameterInfo } from '../illustrations';
import { popoverPosition, AnchorRect } from './popoverPosition';
import { PopoverHeader } from './PopoverHeader';
import { PopoverFormula } from './PopoverFormula';
import { PopoverDescription } from './PopoverDescription';
import { PopoverValueRow } from './PopoverValueRow';

interface ParameterPopoverProps {
  parameter:   FormattedParameter;
  anchorRect:  AnchorRect;
  accentColor: string;
  isOpen:      boolean;
  onClose:     () => void;
}

const POPOVER_WIDTH = 260;

export function ParameterPopover({ parameter, anchorRect, accentColor, isOpen, onClose }: ParameterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const info = getParameterInfo(parameter.symbol);
  const audioPlaying = useLumyraStore((s) => s.audioPlaying);
  const beatDetected = useLumyraStore((s) => s.beatDetected);

  useDismissable(popoverRef, onClose);

  // Contador de beats — cada transición false→true incrementa, forzando
  // un remount deliberado del pulso en ParameterIllustration.
  const [beatKey, setBeatKey] = useState(0);
  useEffect(() => {
    if (beatDetected) setBeatKey((k) => k + 1);
  }, [beatDetected]);

  const { left, bottom } = popoverPosition(
    anchorRect,
    POPOVER_WIDTH,
    window.innerWidth,
    window.innerHeight
  );

  return (
    <div
      ref={popoverRef}
      style={{
        position:      'fixed',
        left,
        bottom,
        width:         POPOVER_WIDTH,
        background:    'var(--color-bg-surface)',
        border:        `1px solid ${accentColor}`,
        boxShadow:     'var(--shadow-panel)',
        padding:       14,
        zIndex:        100,
        animation:     isOpen ? 'fade-slide-in 0.2s ease both' : 'fade-slide-out 0.18s ease both',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <PopoverHeader symbol={parameter.symbol} fullName={info.fullName} accentColor={accentColor} />
      <PopoverFormula formula={info.formula} />

      <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', marginBottom: 10, overflow: 'hidden' }}>
        <ParameterIllustration
          type={info.illustration}
          color={accentColor}
          rawValue={parameter.rawValue}
          isReactive={audioPlaying}
          beatKey={beatKey}
        />
      </div>

      <PopoverDescription description={info.description} />
      <PopoverValueRow audioPlaying={audioPlaying} value={parameter.value} accentColor={accentColor} />
    </div>
  );
}
