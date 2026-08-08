'use client';

// Contenedor scrollable de ParameterValue.
//
// Responsabilidad única: el scroll horizontal con snap. No sabe nada
// de qué popover está abierto — solo recibe y renderiza la lista.

import { FormattedParameter } from '../hooks';
import { ParameterValue } from '../parameter';
import { AnchorRect } from '../parameter/popoverPosition';

interface OpenPopoverState {
  symbol: string;
  rect:   AnchorRect;
}

interface ParameterListProps {
  parameters:   FormattedParameter[];
  openPopover:  OpenPopoverState | null;
  onToggle:     (symbol: string, rect: AnchorRect) => void;
  onClose:      () => void;
}

export function ParameterList({ parameters, openPopover, onToggle, onClose }: ParameterListProps) {
  return (
    <div style={{
      flex:                    1,
      display:                 'flex',
      overflowX:               'auto',
      overflowY:               'hidden',
      scrollbarWidth:          'none',
      WebkitOverflowScrolling: 'touch',
      scrollBehavior:          'smooth',
      scrollSnapType:          'x proximity',
    }}>
      {parameters.map((param) => (
        <ParameterValue
          key={param.symbol}
          parameter={param}
          isOpen={openPopover?.symbol === param.symbol}
          anchorRect={openPopover?.symbol === param.symbol ? openPopover.rect : null}
          onToggle={onToggle}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
