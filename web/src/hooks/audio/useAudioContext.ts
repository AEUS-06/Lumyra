'use client';

// Hook responsable únicamente de crear y gestionar el AudioContext de la Web Audio API.
//
// El AudioContext es el entorno de procesamiento de audio del browser.
// Todo el grafo de nodos de audio (fuentes, analizadores, efectos, destino)
// debe pertenecer al mismo AudioContext para poder conectarse entre sí.
//
// Responsabilidad única: gestionar el ciclo de vida del AudioContext.
// Este hook no sabe nada de archivos, FFT, beats ni del store.
//
// Restricción importante del browser:
// El AudioContext debe ser creado o reanudado dentro de un gesto del usuario
// (click, keydown, etc.) por política de autoplay de los navegadores modernos.
// Este hook expone una función resume() para manejar esa restricción.

import { useRef, useCallback, useEffect } from 'react';

// Estado que expone el hook al exterior
export interface AudioContextHandle {
  // El AudioContext creado. Null hasta que el usuario interactúa por primera vez.
  context: AudioContext | null;

  // Crea el AudioContext si no existe, o lo reanuda si estaba suspendido.
  // Debe ser llamado desde un handler de evento de usuario.
  resume: () => Promise<AudioContext>;

  // Suspende el AudioContext liberando recursos de CPU cuando no se usa.
  suspend: () => Promise<void>;

  // Cierra el AudioContext permanentemente. Llamado al desmontar el componente padre.
  close: () => Promise<void>;
}

// Hook que crea y gestiona el AudioContext.
// El contexto se crea de forma lazy al llamar resume() por primera vez,
// cumpliendo con la política de autoplay del browser.
export function useAudioContext(): AudioContextHandle {
  const contextRef = useRef<AudioContext | null>(null);

  // Crea el AudioContext si no existe, o lo reanuda si estaba suspendido.
  // El AudioContext puede quedar suspendido automáticamente por el browser
  // cuando la pestaña pierde el foco o el usuario no interactúa.
  const resume = useCallback(async (): Promise<AudioContext> => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }

    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  // Suspende el AudioContext para liberar recursos de CPU.
  // El estado del grafo de audio se preserva — resume() lo reactiva.
  const suspend = useCallback(async (): Promise<void> => {
    if (contextRef.current && contextRef.current.state === 'running') {
      await contextRef.current.suspend();
    }
  }, []);

  // Cierra el AudioContext de forma permanente.
  // Después de close() el contexto no puede reanudarse — se debe crear uno nuevo.
  const close = useCallback(async (): Promise<void> => {
    if (contextRef.current && contextRef.current.state !== 'closed') {
      await contextRef.current.close();
      contextRef.current = null;
    }
  }, []);

  // Cerrar el contexto al desmontar el componente padre para liberar recursos
  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  return {
    get context() {
      return contextRef.current;
    },
    resume,
    suspend,
    close,
  };
}