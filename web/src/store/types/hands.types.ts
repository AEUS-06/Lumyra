// Tipos relacionados al tracking de manos con MediaPipe Hands.
// MediaPipe detecta 21 landmarks por mano en coordenadas normalizadas [0,1].
// Estos datos se traducen en parámetros físicos que controlan el campo electromagnético.

// Índices de los 21 landmarks de MediaPipe Hands.
// Usados para acceder a posiciones específicas del esqueleto de la mano.
export enum HandLandmark {
  WRIST = 0,
  THUMB_CMC = 1,
  THUMB_MCP = 2,
  THUMB_IP = 3,
  THUMB_TIP = 4,
  INDEX_MCP = 5,
  INDEX_PIP = 6,
  INDEX_DIP = 7,
  INDEX_TIP = 8,
  MIDDLE_MCP = 9,
  MIDDLE_PIP = 10,
  MIDDLE_DIP = 11,
  MIDDLE_TIP = 12,
  RING_MCP = 13,
  RING_PIP = 14,
  RING_DIP = 15,
  RING_TIP = 16,
  PINKY_MCP = 17,
  PINKY_PIP = 18,
  PINKY_DIP = 19,
  PINKY_TIP = 20,
}

// Punto 3D normalizado devuelto por MediaPipe para cada landmark.
// x e y están en el rango [0,1] relativo al frame de la cámara.
// z es la profundidad relativa a la muñeca, negativo significa más cerca de la cámara.
export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

// Gestos reconocidos a partir de la geometría de los landmarks.
// Se calculan en handUtils.ts comparando distancias y ángulos entre puntos clave.
export type HandGesture =
  | "open"       // mano abierta: expande el campo, aumenta la amplitud de las ondas
  | "closed"     // puño cerrado: comprime la energía, concentra las fuentes del campo
  | "pinch"      // pulgar e índice juntos: crea una fuente puntual de carga en esa posición
  | "point"      // solo el índice extendido: dirige la corriente J en esa dirección
  | "victory"    // índice y medio extendidos: crea interferencia entre dos fuentes
  | "neutral";   // estado de reposo sin gesto reconocido

// Parámetros físicos derivados de la posición y geometría de una mano.
// Son calculados en handUtils.ts y escritos al store en cada frame de MediaPipe.
export interface HandPhysicalParams {
  // Apertura de la mano: distancia normalizada entre punta del pulgar y punta del meñique.
  // Rango [0,1]. 0 = puño cerrado, 1 = mano completamente abierta.
  // Mapea a la amplitud del campo eléctrico E.
  aperture: number;

  // Posición normalizada del centroide de la mano en el frame de la cámara.
  // x e y en rango [0,1], donde (0,0) es esquina superior izquierda.
  // La posición Y de la mano derecha mapea a la frecuencia angular ω.
  position: { x: number; y: number };

  // Velocidad de movimiento de la mano entre frames consecutivos.
  // Calculada como: v = |position(t) - position(t-1)| / dt
  // Una velocidad alta inyecta energía al campo, aumenta E_magnitude transitoriamente.
  velocity: number;

  // Inclinación de la mano en radianes, calculada a partir del eje muñeca-dedo medio.
  // Rango [-π, π]. Controla la dirección del vector de corriente J en el campo.
  tilt: number;
}

// Datos completos de una mano detectada en un frame
export interface HandData {
  // Mano izquierda detectada. Controla amplitud, intensidad y rho (ρ) del campo.
  left: {
    detected: boolean;
    landmarks: LandmarkPoint[];
    gesture: HandGesture;
    params: HandPhysicalParams;
  } | null;

  // Mano derecha detectada. Controla frecuencia, modulación y omega (ω) del campo.
  right: {
    detected: boolean;
    landmarks: LandmarkPoint[];
    gesture: HandGesture;
    params: HandPhysicalParams;
  } | null;

  // Distancia entre los centroides de ambas manos, normalizada por el ancho del frame.
  // Cuando ambas manos se acercan, se incrementa la harmonicity de la síntesis de audio.
  // Inspirado en la resonancia electromagnética entre dos dipolos oscilantes.
  handsDistance: number | null;
}

// Estado completo del sistema de tracking de manos en el store
export interface HandsState {
  // Indica si la cámara está activa y MediaPipe está procesando frames
  cameraActive: boolean;

  // Indica si al menos una mano fue detectada en el frame más reciente
  handsDetected: boolean;

  // Datos de posición y gestos del frame actual. Null si no hay manos detectadas.
  handData: HandData | null;

  // Acciones del slice
  setCameraActive: (active: boolean) => void;
  setHandsDetected: (detected: boolean) => void;
  setHandData: (data: HandData | null) => void;
  resetHands: () => void;
}