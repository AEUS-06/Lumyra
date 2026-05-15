'use client';

// Hook responsable únicamente de solicitar y gestionar el stream de video
// de la cámara del usuario mediante la API getUserMedia del browser.
//
// El stream de video es la fuente de datos para MediaPipe Hands.
// Este hook no sabe nada de MediaPipe, landmarks, gestos ni del store.
//
// Responsabilidad única: ciclo de vida del stream de la cámara.
// Solicitar acceso, exponer el stream y liberarlo al desmontar.

import { useRef, useState, useCallback, useEffect } from 'react';

// Configuración de la cámara solicitada al browser.
// Se prefiere la cámara frontal porque el usuario interactúa frente a la pantalla.
// La resolución afecta la precisión de MediaPipe: mayor resolución = más precisión
// pero mayor costo de procesamiento.
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width:  { ideal: 1280 },
    height: { ideal: 720  },
    frameRate: { ideal: 30, max: 60 },
  },
  audio: false,
};

export interface CameraStreamState {
  // El stream de video activo. Null si la cámara no está activa.
  stream: MediaStream | null;

  // Verdadero mientras se espera el permiso del usuario o se inicializa el stream
  loading: boolean;

  // Mensaje de error si el acceso fue denegado o no hay cámara disponible
  error: string | null;

  // Verdadero si el stream está activo y transmitiendo frames
  active: boolean;
}

export interface CameraStreamHandle extends CameraStreamState {
  // Solicita acceso a la cámara y activa el stream.
  // Debe llamarse desde un handler de evento de usuario en algunos browsers.
  start: () => Promise<void>;

  // Detiene todos los tracks del stream y libera la cámara.
  // La cámara queda disponible para otras aplicaciones.
  stop: () => void;

  // Referencia al elemento <video> donde se renderiza el stream.
  // MediaPipe necesita leer frames desde un elemento de video activo.
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// Hook que gestiona el stream de video de la cámara.
export function useCameraStream(): CameraStreamHandle {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraStreamState>({
    stream:  null,
    loading: false,
    error:   null,
    active:  false,
  });

  // Solicita acceso a la cámara y conecta el stream al elemento de video.
  // getUserMedia retorna una promesa que se resuelve cuando el usuario
  // otorga permiso o se rechaza si lo deniega.
  const start = useCallback(async (): Promise<void> => {
    if (streamRef.current) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      streamRef.current = stream;

      // Conectar el stream al elemento de video para que MediaPipe pueda leer frames.
      // El video debe estar reproduciéndose para que los frames estén disponibles.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState({
        stream,
        loading: false,
        error:   null,
        active:  true,
      });
    } catch (err) {
      // Los errores más comunes son NotAllowedError (permiso denegado)
      // y NotFoundError (no hay cámara disponible en el dispositivo)
      const message =
        err instanceof Error ? err.message : 'No se pudo acceder a la cámara';

      setState({
        stream:  null,
        loading: false,
        error:   message,
        active:  false,
      });
    }
  }, []);

  // Detiene todos los tracks del stream y libera el hardware de la cámara.
  // Es importante llamar stop() en cada track individualmente — detener el stream
  // no es suficiente en todos los browsers para apagar el indicador de cámara activa.
  const stop = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState({
      stream:  null,
      loading: false,
      error:   null,
      active:  false,
    });
  }, []);

  // Liberar la cámara al desmontar el componente padre
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    start,
    stop,
    videoRef,
  };
}