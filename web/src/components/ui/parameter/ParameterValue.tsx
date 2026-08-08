'use client';

// Parámetro individual dentro del strip.
//
// Responsabilidad única: mantener la ref del trigger, calcular su
// posición al hacer click, y componer ParameterTrigger + ParameterPopover.
// El timing de apertura/cierre vive en usePopoverLifecycle.

import { useRef } from 'react';
import { FormattedParameter, usePopoverLifecycle } from '../hooks';
import { ParameterTrigger } from './ParameterTrigger';
import { ParameterPopover } from './ParameterPopover';
import { AnchorRect } from './popoverPosition';

interface ParameterValueProps {
  parameter:  FormattedParameter;
  isOpen:     boolean;
  onToggle:   (symbol: string, rect: AnchorRect) => void;
  onClose:    () => void;
  anchorRect: AnchorRect | null;
}

const CLOSE_ANIMATION_MS = 180;

export function ParameterValue({ parameter, isOpen, onToggle, onClose, anchorRect }: ParameterValueProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldRenderPopover = usePopoverLifecycle(isOpen, CLOSE_ANIMATION_MS);

  const accentColor = parameter.isHot
    ? 'var(--color-hot)'
    : parameter.isActive
    ? 'var(--color-active)'
    : 'var(--color-text-dim)';

  function handleClick() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    onToggle(parameter.symbol, { left: rect.left, top: rect.top, width: rect.width });
  }

  return (
    <div style={{ position: 'relative', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
      <ParameterTrigger
        ref={triggerRef}
        parameter={parameter}
        isOpen={isOpen}
        accentColor={accentColor}
        onClick={handleClick}
      />

      {shouldRenderPopover && anchorRect && (
        <ParameterPopover
          parameter={parameter}
          anchorRect={anchorRect}
          accentColor={accentColor}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </div>
  );
}
