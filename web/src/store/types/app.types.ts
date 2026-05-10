// Tipos relacionados al estado global de la aplicación.
// Controla el modo activo, configuración de la UI y parámetros globales del sistema.

// Modos de operación de Lumyra.
// Cada modo define una fuente distinta para los parámetros del campo electromagnético.
export type AppMode =
  | "audio"   // el campo es modulado por el análisis FFT de una canción cargada
  | "hands";  // el campo es controlado en tiempo real por los gestos de las manos

// Configuración global del sistema de renderizado y simulación
export interface AppConfig {
  // Número de partículas activas en la simulación.
  // Valores altos incrementan el costo de renderizado, especialmente en móvil.
  particleCount: number;

  // Número de líneas de campo trazadas por fuente.
  // Cada línea se integra numéricamente desde una semilla alrededor de la fuente.
  fieldLinesPerSource: number;

  // Número máximo de pasos de integración por línea de campo.
  // Controla la longitud máxima de cada línea antes de que el trazador se detenga.
  fieldLineMaxSteps: number;

  // Tamaño del paso de integración de Euler para el trazado de líneas de campo.
  // Un valor más pequeño produce líneas más precisas pero requiere más pasos.
  fieldLineStepSize: number;

  // Indica si el dispositivo es móvil. Reduce automáticamente la carga de renderizado.
  isMobile: boolean;

  // Muestra información de rendimiento en pantalla (FPS, tiempo de frame, conteo de partículas)
  showDebugInfo: boolean;
}

// Estado completo de la aplicación en el store
export interface AppState {
  // Modo activo actual
  mode: AppMode;

  // Configuración del sistema de renderizado
  config: AppConfig;

  // Indica si la interfaz de usuario está visible o en modo inmersivo (solo canvas)
  uiVisible: boolean;

  // Acciones del slice
  setMode: (mode: AppMode) => void;
  setConfig: (config: Partial<AppConfig>) => void;
  setUiVisible: (visible: boolean) => void;
  resetApp: () => void;
}

// Configuración por defecto. Se adapta automáticamente a móvil en AppSlice.
export const defaultAppConfig: AppConfig = {
  particleCount: 80,
  fieldLinesPerSource: 16,
  fieldLineMaxSteps: 200,
  fieldLineStepSize: 0.005,
  isMobile: false,
  showDebugInfo: false,
};

// Configuración reducida para dispositivos móviles.
// Mantiene la experiencia visual coherente con menor costo computacional.
export const mobileAppConfig: AppConfig = {
  particleCount: 40,
  fieldLinesPerSource: 8,
  fieldLineMaxSteps: 100,
  fieldLineStepSize: 0.008,
  isMobile: true,
  showDebugInfo: false,
};