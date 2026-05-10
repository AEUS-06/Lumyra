// Punto de entrada del dominio audio.
// Los hooks y componentes importan desde aquí, nunca desde los archivos internos directamente.
// Esto permite reorganizar la implementación interna sin afectar los imports externos.

export * from "./fft";
export * from "./beatDetection";
export * from "./mapping";