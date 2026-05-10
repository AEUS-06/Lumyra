import { create } from "zustand";
import { createFieldSlice } from "@/store/slices/fieldSlice";
import { createAudioSlice } from "@/store/slices/audioSlice";
import { createHandsSlice } from "@/store/slices/handsSlice";
import { createAppSlice } from "@/store/slices/appSlice";
import { FieldState } from "@/store/types/field.types";
import { AudioState } from "@/store/types/audio.types";
import { HandsState } from "@/store/types/hands.types";
import { AppState } from "@/store/types/app.types";

// LumyraStore es la unión de todos los slices.
// Cada slice es responsable de un dominio independiente.
// Ningún slice conoce la existencia de los demás — la composición ocurre únicamente aquí.
export type LumyraStore = FieldState & AudioState & HandsState & AppState;

// useLumyraStore es el único hook de store que exporta la aplicación.
// Los componentes importan solo los selectores que necesitan para evitar re-renders innecesarios.
//
// Uso correcto — solo suscribirse a lo que se necesita:
//   const fieldParams = useLumyraStore((state) => state.fieldParams);
//   const setAudioFrame = useLumyraStore((state) => state.setAudioFrame);
//
// Uso incorrecto — suscribirse al store completo:
//   const store = useLumyraStore();
export const useLumyraStore = create<LumyraStore>((...args) => ({
  ...createFieldSlice(...args),
  ...createAudioSlice(...args),
  ...createHandsSlice(...args),
  ...createAppSlice(...args),
}));

// Re-exportaciones de tipos para que los componentes no necesiten
// conocer la ruta interna de cada slice
export type { FieldParams, FieldSource, FieldState } from "@/store/types/field.types";
export type { AudioFrame, AudioBands, AudioState } from "@/store/types/audio.types";
export type { HandData, HandGesture, HandPhysicalParams, HandsState } from "@/store/types/hands.types";
export type { AppMode, AppConfig, AppState } from "@/store/types/app.types";