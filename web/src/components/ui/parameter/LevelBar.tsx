'use client';

// Barra de nivel segmentada, estilo VU meter de hardware.
//
// Responsabilidad única: renderizar los segmentos según un nivel [0,1].
// No sabe nada del parámetro que representa — solo pinta segmentos.

interface LevelBarProps {
  level:       number; // [0,1]
  accentColor: string;
  segments?:   number;
}

export function LevelBar({ level, accentColor, segments = 8 }: LevelBarProps) {
  const litCount = Math.round(Math.max(0, Math.min(1, level)) * segments);

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: segments }, (_, i) => {
        const lit = i < litCount;
        // Los últimos 2 segmentos se tiñen de "hot" aunque el resto esté
        // en el color activo normal — imita un VU meter real donde el
        // tope de la escala cambia de color.
        const segColor = lit
          ? (i >= segments - 2 ? 'var(--color-hot)' : accentColor)
          : 'var(--color-border)';

        return (
          <div
            key={i}
            style={{
              flex:       1,
              height:     5,
              background: segColor,
              opacity:    lit ? 1 : 0.5,
              transition: 'background 0.15s ease, opacity 0.15s ease',
              willChange: 'background, opacity',
            }}
          />
        );
      })}
    </div>
  );
}
