'use client';

// Hook responsable únicamente de evaluar una media query CSS en runtime.
//
// Los estilos inline de React no pueden usar @media — este hook es el
// puente necesario para que componentes con inline styles reaccionen
// al viewport. Se suscribe a matchMedia y re-renderiza en cada cambio.

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Breakpoints estándar del proyecto — un solo lugar de verdad
export const BREAKPOINTS = {
  narrow: '(max-width: 480px)',
  mobile: '(max-width: 767px)',
} as const;