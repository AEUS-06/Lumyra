'use client';

// Hook responsable únicamente de formatear los valores físicos del campo
// electromagnético a strings legibles para mostrar en la UI.
//
// Además del string formateado, expone rawValue (el número [0,1] sin
// formatear) para que componentes como ParameterIllustration puedan
// modular su geometría proporcionalmente al valor real.

import { useMemo } from 'react';
import { FieldParams } from '@/store/types/field.types';

export interface FormattedParameter {
  symbol:   string;
  name:     string;
  value:    string;
  rawValue: number;
  isActive: boolean;
  isHot:    boolean;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function isActive(value: number): boolean {
  return value > 0.45;
}

function isHot(value: number): boolean {
  return value > 0.78;
}

export function useParameterFormat(fieldParams: FieldParams): FormattedParameter[] {
  return useMemo(() => [
    { symbol: 'ρ',     name: 'densidad de carga',            value: fmt(fieldParams.rho),         rawValue: fieldParams.rho,         isActive: isActive(fieldParams.rho),         isHot: isHot(fieldParams.rho) },
    { symbol: 'J',     name: 'densidad de corriente',         value: fmt(fieldParams.J),           rawValue: fieldParams.J,           isActive: isActive(fieldParams.J),           isHot: isHot(fieldParams.J) },
    { symbol: '∂B/∂t', name: 'variación del campo magnético', value: fmt(fieldParams.dBdt),        rawValue: fieldParams.dBdt,        isActive: isActive(fieldParams.dBdt),        isHot: isHot(fieldParams.dBdt) },
    { symbol: 'ε₀',    name: 'permitividad del vacío',        value: fmt(fieldParams.epsilon),     rawValue: fieldParams.epsilon,     isActive: isActive(fieldParams.epsilon),     isHot: isHot(fieldParams.epsilon) },
    { symbol: 'μ₀',    name: 'permeabilidad del vacío',       value: fmt(fieldParams.mu),          rawValue: fieldParams.mu,          isActive: isActive(fieldParams.mu),          isHot: isHot(fieldParams.mu) },
    { symbol: 'ω',     name: 'frecuencia angular',            value: fmt(fieldParams.omega),       rawValue: fieldParams.omega,       isActive: isActive(fieldParams.omega),       isHot: isHot(fieldParams.omega) },
    { symbol: 'λ',     name: 'longitud de onda',              value: fmt(fieldParams.lambda),      rawValue: fieldParams.lambda,      isActive: isActive(fieldParams.lambda),      isHot: isHot(fieldParams.lambda) },
    { symbol: '|E|',   name: 'magnitud del campo eléctrico',  value: fmt(fieldParams.E_magnitude), rawValue: fieldParams.E_magnitude, isActive: isActive(fieldParams.E_magnitude), isHot: isHot(fieldParams.E_magnitude) },
  ], [fieldParams]);
}
