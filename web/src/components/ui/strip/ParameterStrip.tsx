'use client';

// Strip inferior de Lumyra.
//
// Responsabilidad única: componer ModeLabel, HomeButton y ParameterList,
// y gestionar cuál popover está abierto — solo uno a la vez. fieldParams
// se lee con throttle para no re-renderizar 60 veces por segundo.

import { useCallback, useState } from 'react';
import { useLumyraStore, LumyraStore } from '@/store';
import { useParameterFormat, useMediaQuery, useThrottledStoreValue, BREAKPOINTS } from '../hooks';
import { AnchorRect } from '../parameter';
import { ModeLabel } from './ModeLabel';
import { HomeButton } from './HomeButton';
import { ParameterList } from './ParameterList';

const selectFieldParams = (s: LumyraStore) => s.fieldParams;

interface OpenPopoverState {
  symbol: string;
  rect:   AnchorRect;
}

export function ParameterStrip() {
  const fieldParams = useThrottledStoreValue(selectFieldParams, 66);
  const mode        = useLumyraStore((s) => s.mode);
  const parameters  = useParameterFormat(fieldParams);
  const isNarrow    = useMediaQuery(BREAKPOINTS.narrow);

  const [openPopover, setOpenPopover] = useState<OpenPopoverState | null>(null);

  const handleToggle = useCallback((symbol: string, rect: AnchorRect) => {
    setOpenPopover((prev) => (prev?.symbol === symbol ? null : { symbol, rect }));
  }, []);

  const handleClose = useCallback(() => setOpenPopover(null), []);

  return (
    <footer style={{
      position:             'absolute',
      bottom:               0,
      left:                 0,
      right:                0,
      height:               'var(--strip-height)',
      background:           'var(--color-bg-panel)',
      backdropFilter:       'var(--backdrop-blur)',
      WebkitBackdropFilter: 'var(--backdrop-blur)',
      borderTop:            '1px solid var(--color-border)',
      display:              'flex',
      alignItems:           'stretch',
      zIndex:               50,
    }}>
      {!isNarrow && <ModeLabel mode={mode} />}
      <HomeButton showLabel={!isNarrow} />
      <ParameterList
        parameters={parameters}
        openPopover={openPopover}
        onToggle={handleToggle}
        onClose={handleClose}
      />
    </footer>
  );
}
