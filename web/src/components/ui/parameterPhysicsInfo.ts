// Información física estática de cada parámetro del campo electromagnético.
//
// Responsabilidad única: datos puros, sin lógica ni estado.
// Es la fuente de contenido educativo para ParameterPopover.
// No es un hook — es un mapa de datos, se importa directamente.

export interface ParameterPhysicsInfo {
  fullName:    string;
  formula:     string;
  description: string;
  // Tipo de ilustración a mostrar en el popover — ver ParameterIllustration.tsx
  illustration: 'density' | 'current' | 'induction' | 'permittivity' | 'permeability' | 'frequency' | 'wavelength' | 'field';
}

const INFO: Record<string, ParameterPhysicsInfo> = {
  'ρ': {
    fullName:    'Densidad de carga',
    formula:     '∇·E = ρ/ε₀',
    description: 'La ley de Gauss. A más carga en un punto, más intensas y numerosas son las fuentes del campo — las partículas positivas se agrupan y aceleran.',
    illustration: 'density',
  },
  'J': {
    fullName:    'Densidad de corriente',
    formula:     '∇×B = μ₀J + μ₀ε₀∂E/∂t',
    description: 'Ley de Ampère-Maxwell. La corriente es carga en movimiento — controla qué tan rápido fluyen las partículas a lo largo de las líneas de campo.',
    illustration: 'current',
  },
  '∂B/∂t': {
    fullName:    'Variación del campo magnético',
    formula:     '∇×E = −∂B/∂t',
    description: 'Ley de Faraday. Un campo magnético que cambia en el tiempo induce un campo eléctrico rotacional — así se curvan y giran las líneas de campo.',
    illustration: 'induction',
  },
  'ε₀': {
    fullName:    'Permitividad del vacío',
    formula:     'c = 1/√(μ₀ε₀)',
    description: 'Determina qué tan fácil es que el vacío permita la formación de un campo eléctrico. Valores altos expanden el campo con menos resistencia.',
    illustration: 'permittivity',
  },
  'μ₀': {
    fullName:    'Permeabilidad del vacío',
    formula:     'c = 1/√(μ₀ε₀)',
    description: 'Determina qué tan fácil se propagan las perturbaciones magnéticas por el vacío. Junto a ε₀, define la velocidad de la luz.',
    illustration: 'permeability',
  },
  'ω': {
    fullName:    'Frecuencia angular',
    formula:     'ω = 2πf',
    description: 'Qué tan rápido oscila el campo en el tiempo. Frecuencias altas producen partículas que vibran y cambian de dirección con más rapidez.',
    illustration: 'frequency',
  },
  'λ': {
    fullName:    'Longitud de onda',
    formula:     'λ = c/f',
    description: 'La distancia entre dos crestas sucesivas de la onda electromagnética. Inversamente proporcional a la frecuencia — ondas rápidas son más cortas.',
    illustration: 'wavelength',
  },
  '|E|': {
    fullName:    'Magnitud del campo eléctrico',
    formula:     'F = qE',
    description: 'La intensidad total del campo en un punto. Determina la fuerza que sentiría una carga de prueba colocada ahí — más magnitud, más aceleración.',
    illustration: 'field',
  },
};

// Devuelve la información física de un símbolo, o un fallback genérico
// si el símbolo no está mapeado (defensivo — no debería ocurrir en uso normal).
export function getParameterInfo(symbol: string): ParameterPhysicsInfo {
  return INFO[symbol] ?? {
    fullName:     symbol,
    formula:      '—',
    description:  'Parámetro del campo electromagnético.',
    illustration: 'field',
  };
}