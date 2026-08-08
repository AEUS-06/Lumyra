'use client';

// Hook responsable únicamente de detectar clicks fuera de un elemento
// o la tecla Escape, y disparar un callback de cierre.
//
// Responsabilidad única: el patrón de dismissal. Reutilizable por
// cualquier componente tipo popover/dropdown/modal del proyecto,
// no solo por ParameterPopover.

import { useEffect, RefObject } from 'react';

export function useDismissable(
  ref:     RefObject<HTMLElement | null>,
  onClose: () => void
): void {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
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
  }, [ref, onClose]);
}
