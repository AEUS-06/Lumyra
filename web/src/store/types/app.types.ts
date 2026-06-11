// Tipos relacionados al estado global de la aplicación.

// Modo de operación — solo audio por ahora
export type AppMode = 'audio';

export interface AppConfig {
  particleCount:       number;
  fieldLinesPerSource: number;
  fieldLineMaxSteps:   number;
  fieldLineStepSize:   number;
  isMobile:            boolean;
  showDebugInfo:       boolean;
}

export interface AppState {
  mode:         AppMode;
  config:       AppConfig;
  uiVisible:    boolean;
  setMode:      (mode: AppMode) => void;
  setConfig:    (config: Partial<AppConfig>) => void;
  setUiVisible: (visible: boolean) => void;
  resetApp:     () => void;
}

export const defaultAppConfig: AppConfig = {
  particleCount:       80,
  fieldLinesPerSource: 16,
  fieldLineMaxSteps:   200,
  fieldLineStepSize:   0.005,
  isMobile:            false,
  showDebugInfo:       false,
};

export const mobileAppConfig: AppConfig = {
  particleCount:       40,
  fieldLinesPerSource: 8,
  fieldLineMaxSteps:   100,
  fieldLineStepSize:   0.008,
  isMobile:            true,
  showDebugInfo:       false,
};