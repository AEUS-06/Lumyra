// Tipos relacionados al campo electromagnético.
// Las variables siguen la notación estándar de las ecuaciones de Maxwell en forma diferencial.

// Parámetros electromagnéticos que describen el estado del campo en un instante dado.
// Estos valores son calculados a partir del audio o de los gestos de las manos
// y alimentan directamente la simulación visual y sonora.
export interface FieldParams {
  // rho (ρ): densidad volumétrica de carga eléctrica.
  // Unidad física: culombios por metro cúbico (C/m³).
  // Aparece en la primera ecuación de Maxwell, ley de Gauss eléctrica: ∇·E = ρ/ε₀
  // Describe cuánta carga eléctrica existe en un punto del espacio.
  // En Lumyra: controla la intensidad de las fuentes del campo. Mapeado desde energía de bajos.
  rho: number;

  // J: densidad de corriente eléctrica.
  // Unidad física: amperios por metro cuadrado (A/m²).
  // Aparece en la cuarta ecuación de Maxwell, ley de Ampère-Maxwell: ∇×B = μ₀J + μ₀ε₀·∂E/∂t
  // Describe el flujo de carga eléctrica por unidad de área.
  // En Lumyra: controla la velocidad y dirección de movimiento de las partículas. Mapeado desde energía de medios.
  J: number;

  // dBdt: variación temporal del campo magnético (∂B/∂t).
  // Unidad física: teslas por segundo (T/s).
  // Aparece en la tercera ecuación de Maxwell, ley de Faraday: ∇×E = -∂B/∂t
  // Un campo magnético que varía en el tiempo induce un campo eléctrico rotacional.
  // En Lumyra: modula la curvatura y rotación de las líneas de campo. Mapeado desde altas frecuencias.
  dBdt: number;

  // epsilon (ε₀): permitividad eléctrica del vacío.
  // Unidad física: faradios por metro (F/m). Valor real: 8.854 × 10⁻¹² F/m
  // Aparece en la ley de Gauss (∇·E = ρ/ε₀) y determina la velocidad de la luz: c = 1/√(μ₀ε₀)
  // Describe la capacidad del vacío para permitir la formación de campos eléctricos.
  // En Lumyra: normalizado entre 0 y 1. Escala la respuesta del campo ante cambios de carga.
  epsilon: number;

  // mu (μ₀): permeabilidad magnética del vacío.
  // Unidad física: henrios por metro (H/m). Valor real: 4π × 10⁻⁷ H/m
  // Aparece en la ley de Ampère-Maxwell y determina la velocidad de la luz junto con ε₀.
  // Describe la capacidad del vacío para permitir la formación de campos magnéticos.
  // En Lumyra: normalizado entre 0 y 1. Controla la velocidad de propagación de perturbaciones.
  mu: number;

  // E_magnitude: magnitud del vector campo eléctrico resultante.
  // Unidad física: voltios por metro (V/m).
  // Para una carga puntual en 2D: |E| = ρ / (2π·ε₀·r), donde r es la distancia a la fuente.
  // En Lumyra: determina la longitud visual y opacidad de las líneas de campo dibujadas.
  E_magnitude: number;

  // omega (ω): frecuencia angular de oscilación del campo electromagnético.
  // Unidad física: radianes por segundo (rad/s).
  // Relacionada con la frecuencia ordinaria f mediante: ω = 2πf
  // En una onda electromagnética plana: E(x,t) = E₀·cos(kx - ωt)
  // En Lumyra: controla la velocidad de oscilación visual y la frecuencia base de síntesis de audio.
  omega: number;

  // lambda (λ): longitud de onda de la radiación electromagnética.
  // Unidad física: metros (m).
  // Relacionada con la velocidad de la luz y la frecuencia: λ = c/f = 2πc/ω
  // En Lumyra: normalizado entre 0 y 1. Determina el espaciado visual entre frentes de onda.
  lambda: number;

  // k: número de onda del campo.
  // Unidad física: radianes por metro (rad/m).
  // Definido como: k = 2π/λ = ω/c
  // Aparece en la solución de onda plana de las ecuaciones de Maxwell: E(x,t) = E₀·cos(kx - ωt)
  // En Lumyra: controla la frecuencia espacial de los patrones de interferencia visuales.
  k: number;
}

// Fuente puntual del campo electromagnético en el espacio 2D de la simulación.
// El campo total en cualquier punto se calcula por superposición de todas las fuentes activas:
// E_total(r) = Σᵢ Eᵢ(r) = Σᵢ [qᵢ / (2π·ε₀)] · (r - rᵢ) / |r - rᵢ|²
export interface FieldSource {
  // Identificador único de la fuente
  id: string;

  // Posición de la fuente en el espacio normalizado del canvas [0,1] en x e y
  position: { x: number; y: number };

  // q: carga eléctrica de la fuente.
  // Unidad física: culombios (C). En Lumyra: normalizado entre -1 y 1.
  // Positivo: fuente de campo (las líneas de campo salen radialmente).
  // Negativo: sumidero de campo (las líneas de campo entran radialmente).
  charge: number;

  // Intensidad visual de la fuente, independiente de su carga física.
  // Controla la opacidad y tamaño del glifo visual de la fuente en el canvas.
  intensity: number;

  // Origen de la fuente: generada por el sistema de audio o por el tracking de manos
  origin: "audio" | "hands";
}

// Estado completo del campo electromagnético en el store
export interface FieldState {
  // Parámetros físicos del campo en el frame actual
  fieldParams: FieldParams;

  // Lista de fuentes puntuales activas en la simulación
  fieldSources: FieldSource[];

  // Acciones del slice
  setFieldParams: (params: Partial<FieldParams>) => void;
  setFieldSources: (sources: FieldSource[]) => void;
  addFieldSource: (source: FieldSource) => void;
  removeFieldSource: (id: string) => void;
  clearFieldSources: () => void;
  resetFieldParams: () => void;
}

// Valores por defecto del campo. Representa el vacío electromagnético en reposo.
// No hay carga, no hay corriente, no hay variación temporal: el campo existe pero no está excitado.
export const defaultFieldParams: FieldParams = {
  rho: 0.0,
  J: 0.0,
  dBdt: 0.0,
  epsilon: 0.5,
  mu: 0.5,
  E_magnitude: 0.0,
  omega: 0.0,
  lambda: 1.0,
  k: 0.0,
};