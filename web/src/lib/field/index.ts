// Punto de entrada del dominio field.
// Los componentes y hooks importan desde aquí, nunca desde los archivos internos directamente.
// Esto permite reorganizar los internos sin romper los imports externos.

export * from "./vector2";
export * from "./electricField";
export * from "./fieldLines";
export * from "./particles";