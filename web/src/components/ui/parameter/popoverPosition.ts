// Calcula la posición fija de un popover anclado a un elemento trigger,
// con recorte horizontal para que nunca se salga de la ventana.
//
// Responsabilidad única: esta única función pura. No sabe nada de React
// ni del DOM más allá de los números que recibe.

export interface AnchorRect {
  left:  number;
  top:   number;
  width: number;
}

export interface PopoverPosition {
  left:   number;
  bottom: number;
}

export function popoverPosition(
  anchor:        AnchorRect,
  popoverWidth:  number,
  viewportWidth: number,
  viewportHeight: number,
  gap:           number = 10
): PopoverPosition {
  const left = Math.min(
    Math.max(8, anchor.left + anchor.width / 2 - popoverWidth / 2),
    viewportWidth - popoverWidth - 8
  );

  const bottom = viewportHeight - anchor.top + gap;

  return { left, bottom };
}
