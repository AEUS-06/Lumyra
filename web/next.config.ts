import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Marcar los paquetes de MediaPipe como externos para que no sean
  // procesados por el servidor de Next.js. Estos paquetes usan CommonJS
  // con globals y se cargan dinámicamente en el cliente en runtime.
  serverExternalPackages: [
    '@mediapipe/hands',
    '@mediapipe/camera_utils',
    '@mediapipe/drawing_utils',
  ],

  // Configuración vacía de Turbopack para confirmar que es el bundler activo.
  // Los paquetes de MediaPipe se manejan con require() dinámico en useMediaPipe.ts
  // para evitar que Turbopack intente analizar sus exports CommonJS estáticamente.
  turbopack: {},
};

export default nextConfig;