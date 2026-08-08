'use client';

// Botón de navegación al inicio, en la esquina izquierda del strip.
// Responsabilidad única: este botón únicamente. Colapsa a solo ícono
// en pantallas angostas.

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface HomeButtonProps {
  showLabel: boolean;
}

export function HomeButton({ showLabel }: HomeButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <button
      onClick={handleClick}
      title="Ir al inicio"
      style={{
        padding:     '0 14px',
        background:  'transparent',
        border:      'none',
        borderRight: '1px solid var(--color-border)',
        cursor:      'pointer',
        display:     'flex',
        alignItems:  'center',
        gap:         6,
        flexShrink:  0,
        color:       'var(--color-text-muted)',
        transition:  'color 0.15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 1L1 5.5V11H4.5V7.5H7.5V11H11V5.5L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      </svg>
      {showLabel && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          home
        </span>
      )}
    </button>
  );
}
