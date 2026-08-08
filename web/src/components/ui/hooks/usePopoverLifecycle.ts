'use client';

// Hook responsable únicamente del timing de montaje/desmontaje de un popover
// que necesita animar su salida.
//
// Responsabilidad única: dado un booleano isOpen, decide cuándo el
// popover debe seguir montado en el DOM para completar su animación
// de cierre antes de desaparecer. Sin esto, un popover controlado por
// `{isOpen && <Popover />}` desaparece de golpe en vez de desvanecerse.

import { useEffect, useState } from 'react';

export function usePopoverLifecycle(isOpen: boolean, closeAnimationMs: number): boolean {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    const timeout = setTimeout(() => setShouldRender(false), closeAnimationMs);
    return () => clearTimeout(timeout);
  }, [isOpen, closeAnimationMs]);

  return shouldRender;
}
