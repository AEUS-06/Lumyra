import { StateCreator } from "zustand";
import { AppState, AppConfig, AppMode, defaultAppConfig, mobileAppConfig } from "@/store/types/app.types";

// Slice del estado global de la aplicación.
// Responsable del modo activo, la configuración de renderizado y el estado de la UI.
// Es el único slice que puede ser escrito directamente desde componentes de UI.
export const createAppSlice: StateCreator<AppState> = (set) => ({
  // El modo inicial es audio para que el usuario pueda explorar sin necesidad de cámara.
  mode: "audio",

  // La configuración se determina en tiempo de ejecución basándose en el user agent.
  // Si el dispositivo es móvil se usa mobileAppConfig para reducir la carga de renderizado.
  config: typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)
    ? mobileAppConfig
    : defaultAppConfig,

  uiVisible: true,

  // setMode: cambia el modo activo de la aplicación.
  // El cambio de modo es observado por FieldCanvas para hacer la transición visual
  // de disolución y re-formación de las líneas de campo.
  setMode: (mode: AppMode) => set({ mode }),

  // setConfig: actualiza parcialmente la configuración.
  // Permite ajustes en tiempo de ejecución como cambiar el conteo de partículas
  // sin necesidad de reiniciar la simulación.
  setConfig: (config: Partial<AppConfig>) =>
    set((state) => ({
      config: { ...state.config, ...config },
    })),

  // setUiVisible: alterna entre el modo normal y el modo inmersivo.
  // En modo inmersivo solo se ve el canvas y el strip inferior, sin paneles laterales.
  setUiVisible: (uiVisible: boolean) => set({ uiVisible }),

  // Restaura la configuración global al estado inicial.
  resetApp: () =>
    set({
      mode: "audio",
      uiVisible: true,
    }),
});