import { StateCreator } from "zustand";
import { HandsState, HandData } from "@/store/types/hands.types";

// Slice del sistema de tracking de manos.
// Responsable del estado de MediaPipe Hands y los datos de gestos.
// HandTracker.tsx es el único componente que escribe en este slice.
// FieldCanvas lee los landmarks para posicionar fuentes del campo y partículas.
export const createHandsSlice: StateCreator<HandsState> = (set) => ({
  cameraActive: false,
  handsDetected: false,
  handData: null,

  // setCameraActive: indica si el stream de la cámara está activo y MediaPipe está corriendo.
  // La UI usa este valor para mostrar el botón correcto (activar / desactivar cámara).
  setCameraActive: (cameraActive: boolean) => set({ cameraActive }),

  // setHandsDetected: verdadero si al menos una mano aparece en el frame actual.
  // Cuando es falso, el campo vuelve gradualmente al estado de reposo autónomo.
  setHandsDetected: (handsDetected: boolean) => set({ handsDetected }),

  // setHandData: escribe los landmarks y parámetros físicos derivados del frame actual.
  // Es llamado por useHandTracking.ts en cada callback de resultados de MediaPipe.
  setHandData: (handData: HandData | null) => set({ handData }),

  // Restaura el estado de manos a su valor inicial.
  // Usado al desactivar la cámara o al cambiar al modo audio.
  resetHands: () =>
    set({
      cameraActive: false,
      handsDetected: false,
      handData: null,
    }),
});