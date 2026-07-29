'use client';

// Mini animación SVG que ilustra el efecto físico de un parámetro.
//
// Responsabilidad única: renderizar la animación correspondiente a un tipo.
//
// Dos canales de reactividad, deliberadamente separados:
//
// 1. TIMING (animation-duration de los @keyframes) — SIEMPRE fijo.
//    Cambiarlo en cada render reinicia la animación desde cero en CSS,
//    por eso nunca se toca dinámicamente.
//
// 2. FORMA (geometría del SVG: cantidad de ciclos de onda, número de
//    puntos, densidad de flechas) — se recalcula en cada render a partir
//    de rawValue. Esto es seguro: cambiar un atributo `d` de un <path>
//    o la cantidad de elementos renderizados no reinicia ninguna
//    animación en curso, es solo geometría nueva.
//
// El resultado: el ritmo se siente siempre fluido, pero la FORMA de la
// onda — cuántas crestas, qué tan denso el flujo — cambia con la música.

import { ParameterPhysicsInfo } from './parameterPhysicsInfo';

interface ParameterIllustrationProps {
  type:       ParameterPhysicsInfo['illustration'];
  color:      string;
  rawValue:   number;
  isReactive: boolean;
  beatKey:    number;
}

// Genera un path de onda senoidal con un número exacto de ciclos completos
// distribuidos uniformemente en el ancho dado — la base geométrica
// compartida por WavelengthIllustration y PermeabilityIllustration.
function sineWavePath(periods: number, width: number, amplitude: number, baseY: number): string {
  const halfStep = width / (periods * 2);
  let d = `M0,${baseY}`;
  for (let i = 0; i < periods * 2; i++) {
    const cx = halfStep * i + halfStep / 2;
    const cy = baseY + (i % 2 === 0 ? -amplitude : amplitude);
    const ex = halfStep * (i + 1);
    d += ` Q${cx},${cy} ${ex},${baseY}`;
  }
  return d;
}

export function ParameterIllustration({ type, color, rawValue, isReactive, beatKey }: ParameterIllustrationProps) {
  const v = Math.max(0, Math.min(1, rawValue));
  // Intensidad: escala visual global, activa solo con música reproduciéndose
  const intensity = isReactive ? 1 + v * 0.7 : 1;

  return (
    <svg width="100%" height="56" viewBox="0 0 200 56" style={{ display: 'block', overflow: 'visible' }}>
      <g style={{
        transformBox:    'fill-box',
        transformOrigin: 'center',
        transform:       `scale(${intensity})`,
        transition:      'transform 0.35s cubic-bezier(0.2,0,0.2,1)',
      }}>
        {type === 'density'      && <DensityIllustration      color={color} rawValue={v} />}
        {type === 'current'      && <CurrentIllustration      color={color} rawValue={v} />}
        {type === 'induction'    && <InductionIllustration    color={color} />}
        {type === 'permittivity' && <PermittivityIllustration color={color} />}
        {type === 'permeability' && <PermeabilityIllustration color={color} rawValue={v} />}
        {type === 'frequency'    && <FrequencyIllustration    color={color} />}
        {type === 'wavelength'   && <WavelengthIllustration   color={color} rawValue={v} />}
        {type === 'field'        && <FieldIllustration        color={color} rawValue={v} />}
      </g>

      {isReactive && beatKey > 0 && (
        <circle
          key={beatKey}
          cx="100" cy="28" r="4"
          fill="none" stroke={color} strokeWidth={2}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: 'beat-kick 0.4s ease-out',
          }}
        />
      )}
    </svg>
  );
}

interface IllProps { color: string }
interface ReactiveIllProps extends IllProps { rawValue: number }

// ρ — la CANTIDAD de puntos crece con la densidad de carga real
function DensityIllustration({ color, rawValue }: ReactiveIllProps) {
  const count = Math.round(3 + rawValue * 6); // 3..9 puntos según el dato
  const dots = Array.from({ length: count }, (_, i) => 30 + (140 / (count - 1 || 1)) * i);
  return (
    <>
      {dots.map((x, i) => (
        <circle
          key={x}
          cx={x} cy={28} r={4}
          fill={color}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: `dot-multiply 1.2s ease-in-out ${(i % 5) * 0.15}s infinite`,
          }}
        />
      ))}
    </>
  );
}

// J — la CANTIDAD de flechas en vuelo refleja la densidad de corriente
function CurrentIllustration({ color, rawValue }: ReactiveIllProps) {
  const count = Math.round(2 + rawValue * 6); // 2..8 flechas según el dato
  const cycleDuration = 2; // segundos, fijo
  return (
    <>
      <line x1="20" y1="28" x2="180" y2="28" stroke={color} strokeOpacity={0.2} strokeWidth={1} />
      {Array.from({ length: count }, (_, i) => {
        const delay = (i / count) * cycleDuration;
        return (
          <path
            key={i}
            d="M-6,-5 L6,0 L-6,5 Z"
            fill={color}
            style={{
              offsetPath: 'path("M20,28 L180,28")',
              animation: `arrow-travel ${cycleDuration}s linear ${delay}s infinite`,
            } as React.CSSProperties}
          />
        );
      })}
    </>
  );
}

// ∂B/∂t — punto orbitando; la escala general (intensity) ya transmite el efecto
function InductionIllustration({ color }: IllProps) {
  return (
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'orbit-spin 1.8s linear infinite' }}>
      <circle cx="100" cy="28" r="18" fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="3 5" />
      <circle cx="118" cy="28" r="3.5" fill={color} />
    </g>
  );
}

// ε₀ — ondas expandiéndose; la escala general ya transmite el efecto
function PermittivityIllustration({ color }: IllProps) {
  return (
    <>
      {[0, 0.6, 1.2].map((delay, i) => (
        <circle
          key={i}
          cx="100" cy="28" r="4"
          fill="none" stroke={color} strokeWidth={1.5}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: `burst-pulse 1.8s ease-out ${delay}s infinite`,
          }}
        />
      ))}
      <circle cx="100" cy="28" r="3" fill={color} />
    </>
  );
}

// μ₀ — el NÚMERO DE CICLOS de la onda cambia con el dato real,
// usando stroke-dashoffset (timing fijo) en vez de tiling manual —
// evita el problema de sincronizar el período de traslación con el
// ancho variable de cada ciclo.
function PermeabilityIllustration({ color, rawValue }: ReactiveIllProps) {
  const periods = Math.round(3 + rawValue * 5); // 3..8 ciclos según el dato
  const path = sineWavePath(periods, 200, 14, 28);
  const dashUnit = Math.max(4, 100 / periods);
  return (
    <path
      d={path}
      fill="none" stroke={color} strokeWidth={2}
      strokeDasharray={`${dashUnit * 0.6} ${dashUnit * 0.4}`}
      style={{ animation: 'dash-travel 2s linear infinite' }}
    />
  );
}

// ω — oscilación vertical; la escala general amplifica el swing con el dato
function FrequencyIllustration({ color }: IllProps) {
  return (
    <>
      <line x1="100" y1="8" x2="100" y2="48" stroke={color} strokeOpacity={0.15} strokeWidth={1} />
      <circle
        cx="100" cy="28" r="5"
        fill={color}
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: 'oscillate-y 1s ease-in-out infinite',
        }}
      />
    </>
  );
}

// λ — el NÚMERO DE CRESTAS es inversamente proporcional al dato:
// λ alta (onda larga) → pocas crestas caben en el ancho fijo.
// λ baja (onda corta) → muchas crestas caben en el mismo ancho.
function WavelengthIllustration({ color, rawValue }: ReactiveIllProps) {
  const periods = Math.round(2 + (1 - rawValue) * 5); // 2..7 ciclos, inverso
  const path = sineWavePath(periods, 210, 18, 28);
  const dashUnit = Math.max(4, 105 / periods);
  return (
    <path
      d={path}
      fill="none" stroke={color} strokeWidth={2.5}
      strokeDasharray={`${dashUnit * 0.65} ${dashUnit * 0.45}`}
      style={{ animation: 'dash-travel 2.5s linear infinite' }}
    />
  );
}

// |E| — el NÚMERO DE RAYOS activos crece con la magnitud del campo
function FieldIllustration({ color, rawValue }: ReactiveIllProps) {
  const allAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const activeCount = Math.max(2, Math.round(2 + rawValue * 6)); // 2..8 rayos
  const angles = allAngles.slice(0, activeCount);
  return (
    <>
      <circle cx="100" cy="28" r="4" fill={color} />
      {angles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = 100 + Math.cos(rad) * 22;
        const y2 = 28 + Math.sin(rad) * 22;
        return (
          <line
            key={deg}
            x1="100" y1="28" x2={x2} y2={y2}
            stroke={color} strokeWidth={2.5} strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '100px 28px',
              animation: `ray-pulse 1.3s ease-in-out ${i * 0.06}s infinite`,
            }}
          />
        );
      })}
    </>
  );
}