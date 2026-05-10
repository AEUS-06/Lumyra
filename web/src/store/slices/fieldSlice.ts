import { StateCreator } from "zustand";
import { FieldState, FieldSource, FieldParams, defaultFieldParams } from "@/store/types/field.types";

// Slice del campo electromagnético.
// Responsable únicamente del estado de los parámetros físicos del campo y sus fuentes.
// Es escrito por audioSlice (modo audio) y handsSlice (modo manos) pero nunca por UI directamente.
export const createFieldSlice: StateCreator<FieldState> = (set) => ({
  fieldParams: defaultFieldParams,
  fieldSources: [],

  // Actualiza parcialmente los parámetros del campo.
  // Usa Partial<FieldParams> para que cada productor (audio, manos) solo actualice
  // los parámetros que le corresponden sin sobrescribir los demás.
  setFieldParams: (params: Partial<FieldParams>) =>
    set((state) => ({
      fieldParams: { ...state.fieldParams, ...params },
    })),

  // Reemplaza la lista completa de fuentes. Usado cuando el audio regenera fuentes en cada beat.
  setFieldSources: (sources: FieldSource[]) => set({ fieldSources: sources }),

  // Agrega una fuente individual. Usado por el tracking de manos al detectar el gesto pinch.
  addFieldSource: (source: FieldSource) =>
    set((state) => ({
      fieldSources: [...state.fieldSources, source],
    })),

  // Elimina una fuente por su id. Usado cuando una fuente tiene tiempo de vida finito.
  removeFieldSource: (id: string) =>
    set((state) => ({
      fieldSources: state.fieldSources.filter((s) => s.id !== id),
    })),

  // Elimina todas las fuentes. Usado al cambiar de modo o al hacer reset de la sesión.
  clearFieldSources: () => set({ fieldSources: [] }),

  // Restaura los parámetros al estado de vacío electromagnético en reposo.
  resetFieldParams: () => set({ fieldParams: defaultFieldParams }),
});