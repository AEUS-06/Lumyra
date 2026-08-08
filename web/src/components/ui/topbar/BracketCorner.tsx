'use client';

// Marca de esquina tipo corchete alrededor del wordmark, con pulso continuo.
// Responsabilidad única: este elemento decorativo únicamente.

interface BracketCornerProps {
  position: 'top-left' | 'bottom-right';
  delay:    number;
}

export function BracketCorner({ position, delay }: BracketCornerProps) {
  const isTopLeft = position === 'top-left';

  return (
    <span style={{
      position:     'absolute',
      top:          isTopLeft ? 4 : undefined,
      bottom:       !isTopLeft ? 4 : undefined,
      left:         isTopLeft ? 2 : undefined,
      right:        !isTopLeft ? 2 : undefined,
      width:        7,
      height:       7,
      borderTop:    isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      borderLeft:   isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      borderBottom: !isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      borderRight:  !isTopLeft ? '1.5px solid var(--color-active)' : 'none',
      animation:    `bracket-pulse 2.4s ease-in-out ${delay}s infinite`,
    }} />
  );
}
