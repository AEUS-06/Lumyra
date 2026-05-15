'use client';

// Hook responsable únicamente del estado visual del panel de audio.
//
// Responsabilidad única: controlar si el panel está expandido o minimizado.
// Separado de useAudioControls porque el estado visual del panel
// es independiente del estado de reproducción — el panel puede
// minimizarse mientras el audio sigue reproduciéndose.

import { useState, useCallback } from 'react';

export interface AudioPanelStateHandle {
  // Verdadero si el panel está expandido mostrando todos los controles
  expanded: boolean;

  // Alterna entre expandido y minimizado
  toggle: () => void;

  // Expande el panel programáticamente (al cargar un archivo)
  expand: () => void;

  // Minimiza el panel programáticamente
  collapse: () => void;
}

// Hook que gestiona el estado visual del panel de audio.
export function useAudioPanelState(): AudioPanelStateHandle {
  const [expanded, setExpanded] = useState(true);

  const toggle   = useCallback(() => setExpanded((prev) => !prev), []);
  const expand   = useCallback(() => setExpanded(true),  []);
  const collapse = useCallback(() => setExpanded(false), []);

  return { expanded, toggle, expand, collapse };
}