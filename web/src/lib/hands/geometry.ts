// Cálculo de medidas geométricas entre landmarks de MediaPipe Hands.
//
// MediaPipe Hands detecta 21 puntos anatómicos (landmarks) por mano en cada frame.
// Cada landmark tiene coordenadas normalizadas (x, y) en [0,1] relativas al frame
// de la cámara, y una coordenada z que representa profundidad relativa a la muñeca.
//
// Este módulo calcula las propiedades geométricas derivadas de esos puntos:
// distancias, ángulos, orientación y apertura. Son la base para el reconocimiento
// de gestos en gestures.ts y para el mapeo a parámetros físicos en mapping.ts.
//
// Referencia de landmarks:
// https://developers.google.com/mediapipe/solutions/vision/hand_landmarker

import { Vector2, vec2, distance, magnitude, sub, normalize, dot, cross, angle } from "@/lib/field/vector2";
import { LandmarkPoint, HandLandmark } from "@/store/types/hands.types";

// Extrae las coordenadas x,y de un landmark como Vector2.
// Se descarta z porque la simulación es 2D y la profundidad añade ruido visual.
export function landmarkToVec2(landmark: LandmarkPoint): Vector2 {
  return vec2(landmark.x, landmark.y);
}

// Calcula la distancia euclidiana entre dos landmarks en el espacio normalizado.
// Las distancias normalizadas son independientes de la resolución de la cámara
// pero dependen del tamaño de la mano en frame — por eso se normalizan
// posteriormente por el tamaño de la mano usando handSpan().
export function landmarkDistance(a: LandmarkPoint, b: LandmarkPoint): number {
  return distance(landmarkToVec2(a), landmarkToVec2(b));
}

// Calcula el span de la mano: distancia entre la muñeca y la base del dedo medio.
// Se usa como referencia de normalización para hacer las medidas invariantes
// al tamaño de la mano en frame y a la distancia de la mano a la cámara.
// Una mano más cerca de la cámara ocupa más píxeles pero el span también crece,
// por lo que los ratios normalizados permanecen estables.
export function handSpan(landmarks: LandmarkPoint[]): number {
  const wrist = landmarks[HandLandmark.WRIST];
  const middleMcp = landmarks[HandLandmark.MIDDLE_MCP];
  const span = landmarkDistance(wrist, middleMcp);
  // Valor mínimo para evitar división por cero cuando la mano está muy lejos
  return Math.max(span, 0.01);
}

// Calcula el centroide de la mano como promedio de todos los landmarks.
// Representa la posición central de la mano en el frame de la cámara.
// Usado para mapear la posición de la mano a coordenadas del campo electromagnético.
export function handCentroid(landmarks: LandmarkPoint[]): Vector2 {
  const sum = landmarks.reduce(
    (acc, lm) => vec2(acc.x + lm.x, acc.y + lm.y),
    vec2(0, 0)
  );
  return vec2(sum.x / landmarks.length, sum.y / landmarks.length);
}

// Calcula la apertura de la mano normalizada entre 0 y 1.
// Se mide como la distancia entre la punta del pulgar y la punta del meñique,
// normalizada por el span de la mano para compensar la distancia a la cámara.
//
// apertura ≈ 0: puño cerrado
// apertura ≈ 1: mano completamente abierta
//
// En Lumyra: mapea a la amplitud del campo eléctrico E.
// Una mano abierta expande el campo, un puño lo comprime.
export function handAperture(landmarks: LandmarkPoint[]): number {
  const thumbTip  = landmarks[HandLandmark.THUMB_TIP];
  const pinkyTip  = landmarks[HandLandmark.PINKY_TIP];
  const span      = handSpan(landmarks);
  const rawAperture = landmarkDistance(thumbTip, pinkyTip) / span;
  // El ratio típico varía entre ~0.5 (cerrada) y ~2.5 (abierta)
  // Se normaliza a [0,1] usando estos límites empíricos
  return Math.max(0, Math.min(1, (rawAperture - 0.5) / 2.0));
}

// Calcula la distancia normalizada entre la punta del pulgar y la punta del índice.
// Una distancia pequeña (< 0.15 del span) indica el gesto "pinch".
// Usado para crear fuentes puntuales de carga en la posición del pinch.
export function pinchDistance(landmarks: LandmarkPoint[]): number {
  const thumbTip = landmarks[HandLandmark.THUMB_TIP];
  const indexTip = landmarks[HandLandmark.INDEX_TIP];
  const span     = handSpan(landmarks);
  return landmarkDistance(thumbTip, indexTip) / span;
}

// Calcula la inclinación de la mano en radianes.
// Se define como el ángulo del vector que va desde la muñeca hasta la base del dedo medio,
// respecto al eje X positivo. Rango: [-π, π].
//
// inclinación = 0:    mano apuntando a la derecha
// inclinación = π/2:  mano apuntando hacia arriba
// inclinación = -π/2: mano apuntando hacia abajo
//
// En Lumyra: controla la dirección del vector de corriente J en el campo.
export function handTilt(landmarks: LandmarkPoint[]): number {
  const wrist     = landmarkToVec2(landmarks[HandLandmark.WRIST]);
  const middleMcp = landmarkToVec2(landmarks[HandLandmark.MIDDLE_MCP]);
  const direction = sub(middleMcp, wrist);
  return angle(direction);
}

// Determina si un dedo específico está extendido comparando la distancia
// de su punta a la muñeca con la distancia de su articulación MCP a la muñeca.
// Si la punta está más lejos de la muñeca que el MCP, el dedo está extendido.
//
// Este método es robusto a la rotación y escala de la mano porque usa
// distancias normalizadas internamente.
export function isFingerExtended(
  landmarks: LandmarkPoint[],
  tipIndex: HandLandmark,
  mcpIndex: HandLandmark
): boolean {
  const wrist = landmarks[HandLandmark.WRIST];
  const tip   = landmarks[tipIndex];
  const mcp   = landmarks[mcpIndex];

  const distTip = landmarkDistance(wrist, tip);
  const distMcp = landmarkDistance(wrist, mcp);

  // La punta debe estar al menos 20% más lejos que el MCP para contar como extendido
  return distTip > distMcp * 1.2;
}

// Devuelve un array de booleanos indicando qué dedos están extendidos.
// Orden: [pulgar, índice, medio, anular, meñique]
//
// El pulgar usa un criterio diferente porque su movimiento es lateral:
// se compara la punta del pulgar con su articulación IP respecto al MCP.
export function extendedFingers(landmarks: LandmarkPoint[]): boolean[] {
  const thumb  = isFingerExtended(landmarks, HandLandmark.THUMB_TIP,  HandLandmark.THUMB_MCP);
  const index  = isFingerExtended(landmarks, HandLandmark.INDEX_TIP,  HandLandmark.INDEX_MCP);
  const middle = isFingerExtended(landmarks, HandLandmark.MIDDLE_TIP, HandLandmark.MIDDLE_MCP);
  const ring   = isFingerExtended(landmarks, HandLandmark.RING_TIP,   HandLandmark.RING_MCP);
  const pinky  = isFingerExtended(landmarks, HandLandmark.PINKY_TIP,  HandLandmark.PINKY_MCP);

  return [thumb, index, middle, ring, pinky];
}

// Calcula la velocidad de movimiento de la mano entre el frame actual y el anterior.
// La velocidad se expresa en unidades normalizadas por frame.
// Un valor alto indica un movimiento rápido que inyecta energía al campo.
export function handVelocity(
  currentCentroid: Vector2,
  previousCentroid: Vector2
): number {
  return distance(currentCentroid, previousCentroid);
}

// Calcula la distancia normalizada entre los centroides de dos manos.
// Cuando ambas manos se acercan, la interacción electromagnética entre ellas
// se intensifica — análogo a dos dipolos que se aproximan.
// En Lumyra: mapea a la harmonicity del sintetizador FM.
export function handsInteractionDistance(
  leftLandmarks: LandmarkPoint[],
  rightLandmarks: LandmarkPoint[]
): number {
  const leftCenter  = handCentroid(leftLandmarks);
  const rightCenter = handCentroid(rightLandmarks);
  return distance(leftCenter, rightCenter);
}