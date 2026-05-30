'use client';

// Hook responsable únicamente de formatear los valores físicos del campo
// electromagnético a strings legibles para mostrar en la UI.
//
// Responsabilidad única: number → string formateado.
// Centralizar el formato aquí evita que cada componente tenga su propia
// lógica de formateo — si cambia la precisión o el formato, solo cambia aquí.

import { useMemo } from 'react';
import { FieldParams } from '@/store/types/field.types';

// Un parámetro formateado listo para mostrar en la UI
export interface FormattedParameter {
  // Símbolo físico del parámetro (ρ, J, ∂B/∂t, etc.)
  symbol: string;

  // Nombre completo del parámetro para tooltip o label secundario
  name: string;

  // Valor formateado como string con precisión fija
  value: string;

  // Verdadero si el valor está por encima del umbral de actividad (> 0.6)
  // Usado para resaltar visualmente los parámetros activos
  isActive: boolean;

  // Verdadero si el valor está en el rango alto (> 0.8)
  // Usado para resaltar con color especial los valores intensos
  isHot: boolean;
}

// Formatea un valor numérico [0,1] a string con 2 decimales
function fmt(value: number): string {
  return value.toFixed(2);
}

// Determina si un valor está activo
function isActive(value: number): boolean {
  return value > 0.45;
}

// Determina si un valor está en rango alto
function isHot(value: number): boolean {
  return value > 0.78;
}

// Hook que convierte FieldParams en un array de FormattedParameter.
// Se recalcula solo cuando fieldParams cambia, no en cada render.
export function useParameterFormat(fieldParams: FieldParams): FormattedParameter[] {
  return useMemo(() => [
    {
      symbol:   'ρ',
      name:     'densidad de carga',
      value:    fmt(fieldParams.rho),
      isActive: isActive(fieldParams.rho),
      isHot:    isHot(fieldParams.rho),
    },
    {
      symbol:   'J',
      name:     'densidad de corriente',
      value:    fmt(fieldParams.J),
      isActive: isActive(fieldParams.J),
      isHot:    isHot(fieldParams.J),
    },
    {
      symbol:   '∂B/∂t',
      name:     'variación del campo magnético',
      value:    fmt(fieldParams.dBdt),
      isActive: isActive(fieldParams.dBdt),
      isHot:    isHot(fieldParams.dBdt),
    },
    {
      symbol:   'ε₀',
      name:     'permitividad del vacío',
      value:    fmt(fieldParams.epsilon),
      isActive: isActive(fieldParams.epsilon),
      isHot:    isHot(fieldParams.epsilon),
    },
    {
      symbol:   'μ₀',
      name:     'permeabilidad del vacío',
      value:    fmt(fieldParams.mu),
      isActive: isActive(fieldParams.mu),
      isHot:    isHot(fieldParams.mu),
    },
    {
      symbol:   'ω',
      name:     'frecuencia angular',
      value:    fmt(fieldParams.omega),
      isActive: isActive(fieldParams.omega),
      isHot:    isHot(fieldParams.omega),
    },
    {
      symbol:   'λ',
      name:     'longitud de onda',
      value:    fmt(fieldParams.lambda),
      isActive: isActive(fieldParams.lambda),
      isHot:    isHot(fieldParams.lambda),
    },
    {
      symbol:   '|E|',
      name:     'magnitud del campo eléctrico',
      value:    fmt(fieldParams.E_magnitude),
      isActive: isActive(fieldParams.E_magnitude),
      isHot:    isHot(fieldParams.E_magnitude),
    },
  ], [fieldParams]);
}