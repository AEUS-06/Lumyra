// Reconocimiento de gestos de la mano a partir de medidas geométricas.
//
// Los gestos se determinan exclusivamente a partir de los valores calculados
// en geometry.ts — nunca directamente desde landmarks crudos.
// Esto mantiene la separación de responsabilidades: geometry.ts mide,
// gestures.ts interpreta.
//
// Cada gesto tiene una correspondencia con un fenómeno electromagnético
// que controla en la simulación de Lumyra.

import { LandmarkPoint, HandGesture } from "@/store/types/hands.types";
import {
  handAperture,
  pinchDistance,
  extendedFingers,
  handSpan,
  landmarkDistance,
  handCentroid,
} from "./geometry";
import { HandLandmark } from "@/store/types/hands.types";

// Umbrales para el reconocimiento de gestos.
// Son valores empíricos calibrados para funcionar con diferentes tamaños de mano
// y condiciones de iluminación. Se pueden ajustar sin cambiar la lógica de gestos.
const THRESHOLDS = {
  // Distancia normalizada máxima para considerar que hay un pinch activo
  pinch: 0.25,

  // Apertura mínima para considerar la mano completamente abierta
  openHand: 0.65,

  // Apertura máxima para considerar la mano cerrada en puño
  closedFist: 0.25,
} as const;

// Reconoce el gesto "open": mano completamente abierta, todos los dedos extendidos.
//
// Fenómeno electromagnético asociado: expansión del campo.
// Una mano abierta actúa como una carga distribuida en el espacio —
// el campo se expande radialmente desde el centro de la palma.
// Efecto visual: las líneas de campo se expanden, las partículas se dispersan.
function isOpenHand(landmarks: LandmarkPoint[]): boolean {
  const aperture = handAperture(landmarks);
  const fingers  = extendedFingers(landmarks);
  // Al menos 4 de los 5 dedos extendidos y apertura suficiente
  const extendedCount = fingers.filter(Boolean).length;
  return aperture > THRESHOLDS.openHand && extendedCount >= 4;
}

// Reconoce el gesto "closed": puño cerrado, ningún dedo extendido.
//
// Fenómeno electromagnético asociado: compresión de energía.
// Un puño cerrado representa la concentración máxima de carga en un punto —
// análogo a una carga puntual con densidad ρ máxima.
// Efecto visual: las líneas de campo se concentran, las partículas se aceleran hacia el centro.
function isClosedFist(landmarks: LandmarkPoint[]): boolean {
  const aperture = handAperture(landmarks);
  const fingers  = extendedFingers(landmarks);
  const extendedCount = fingers.filter(Boolean).length;
  return aperture < THRESHOLDS.closedFist && extendedCount <= 1;
}

// Reconoce el gesto "pinch": pulgar e índice juntos, resto de dedos en cualquier posición.
//
// Fenómeno electromagnético asociado: creación de una fuente puntual de carga.
// El pinch localiza la energía en el punto exacto de contacto pulgar-índice,
// como una carga eléctrica puntual q concentrada en un punto del espacio.
// Efecto: se crea una nueva FieldSource en la posición de la punta del índice.
function isPinch(landmarks: LandmarkPoint[]): boolean {
  return pinchDistance(landmarks) < THRESHOLDS.pinch;
}

// Reconoce el gesto "point": solo el índice extendido.
//
// Fenómeno electromagnético asociado: dirección de la corriente J.
// El dedo índice actúa como un conductor que define la dirección
// del vector densidad de corriente J en el campo.
// Efecto: las partículas se mueven en la dirección señalada.
function isPoint(landmarks: LandmarkPoint[]): boolean {
  const fingers = extendedFingers(landmarks);
  const [thumb, index, middle, ring, pinky] = fingers;
  // Solo el índice extendido, el resto doblado
  return index && !middle && !ring && !pinky;
}

// Reconoce el gesto "victory": índice y medio extendidos en V.
//
// Fenómeno electromagnético asociado: interferencia entre dos fuentes.
// Los dos dedos representan dos emisores coherentes de ondas electromagnéticas.
// La separación entre las puntas define la diferencia de fase entre ellos.
// Efecto: se crean dos fuentes de carga que producen patrones de interferencia.
function isVictory(landmarks: LandmarkPoint[]): boolean {
  const fingers = extendedFingers(landmarks);
  const [thumb, index, middle, ring, pinky] = fingers;
  return index && middle && !ring && !pinky;
}

// Función principal de reconocimiento de gestos.
// Evalúa los gestos en orden de prioridad — los más específicos primero.
// Retorna el primer gesto que cumple sus condiciones, o "neutral" si ninguno aplica.
//
// El orden importa: "pinch" se evalúa antes que "closed" porque un pinch
// puede tener apertura baja y confundirse con un puño si se invierte el orden.
export function recognizeGesture(landmarks: LandmarkPoint[]): HandGesture {
  if (isPinch(landmarks))   return "pinch";
  if (isPoint(landmarks))   return "point";
  if (isVictory(landmarks)) return "victory";
  if (isOpenHand(landmarks)) return "open";
  if (isClosedFist(landmarks)) return "closed";
  return "neutral";
}

// Calcula la posición de la fuente de carga para el gesto "pinch".
// La fuente se coloca en el punto medio entre pulgar e índice,
// que es el punto de máxima concentración de energía del gesto.
export function pinchSourcePosition(
  landmarks: LandmarkPoint[]
): { x: number; y: number } {
  const thumbTip = landmarks[HandLandmark.THUMB_TIP];
  const indexTip = landmarks[HandLandmark.INDEX_TIP];
  return {
    x: (thumbTip.x + indexTip.x) / 2,
    y: (thumbTip.y + indexTip.y) / 2,
  };
}

// Calcula las dos posiciones de fuente para el gesto "victory".
// Cada dedo extendido actúa como un emisor independiente.
// La separación angular entre ellos modula la diferencia de fase
// de los patrones de interferencia resultantes.
export function victorySourcePositions(
  landmarks: LandmarkPoint[]
): [{ x: number; y: number }, { x: number; y: number }] {
  const indexTip  = landmarks[HandLandmark.INDEX_TIP];
  const middleTip = landmarks[HandLandmark.MIDDLE_TIP];
  return [
    { x: indexTip.x,  y: indexTip.y  },
    { x: middleTip.x, y: middleTip.y },
  ];
}

// Calcula la dirección normalizada para el gesto "point".
// El vector va desde la base del índice hasta su punta,
// representando la dirección del vector de corriente J.
export function pointDirection(
  landmarks: LandmarkPoint[]
): { x: number; y: number } {
  const indexMcp = landmarks[HandLandmark.INDEX_MCP];
  const indexTip = landmarks[HandLandmark.INDEX_TIP];
  const dx = indexTip.x - indexMcp.x;
  const dy = indexTip.y - indexMcp.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 1e-6) return { x: 0, y: 0 };
  return { x: dx / mag, y: dy / mag };
}