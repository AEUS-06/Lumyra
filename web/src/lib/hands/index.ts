// Punto de entrada del dominio hands.
// Los hooks y componentes importan desde aquí, nunca desde los archivos internos directamente.
// Esto permite reorganizar la implementación interna sin afectar los imports externos.

export * from "./geometry";
export * from "./gestures";
export * from "./mapping";