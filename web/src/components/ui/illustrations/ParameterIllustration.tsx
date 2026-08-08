'use client';

// Orquestador de ilustraciones — elige la forma correcta según el tipo
// y aplica la escala de intensidad reactiva a la música.
//
// Responsabilidad única: el switch por tipo + el canal de reactividad
// por escala. Nunca calcula geometría (eso vive en geometry/) ni dibuja
// formas específicas (eso vive en render/).
//
// Dos canales de reactividad, deliberadamente separados:
// 1. TIMING (animation-duration de cada @keyframes) — siempre fijo,
//    definido dentro de cada componente de render/. Cambiarlo en cada
//    render reiniciaría la animación desde cero en CSS.
// 2. FORMA/ESCALA — se recalcula en cada render a partir de rawValue.
//    Es seguro: cambiar un atributo `d`, un transform: scale(), o la
//    cantidad de elementos renderizados no reinicia ninguna animación
//    en curso, es solo geometría o estilo nuevo.

import { ParameterPhysicsInfo } from './parameterPhysicsInfo';
import {
  DensityIllustration, CurrentIllustration, InductionIllustration,
  PermittivityIllustration, PermeabilityIllustration, FrequencyIllustration,
  WavelengthIllustration, FieldIllustration, BeatPulseRing,
} from './render';

interface ParameterIllustrationProps {
  type:       ParameterPhysicsInfo['illustration'];
  color:      string;
  rawValue:   number;
  isReactive: boolean;
  beatKey:    number;
}

export function ParameterIllustration({ type, color, rawValue, isReactive, beatKey }: ParameterIllustrationProps) {
  const v = Math.max(0, Math.min(1, rawValue));
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

      {isReactive && <BeatPulseRing color={color} beatKey={beatKey} />}
    </svg>
  );
}
