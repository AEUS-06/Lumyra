import { StateCreator } from "zustand";
import { AudioState, AudioFrame } from "@/store/types/audio.types";

// Slice del sistema de audio.
// Responsable del estado del análisis espectral y la reproducción.
// AudioEngine.tsx es el único componente que escribe en este slice.
// FieldCanvas y ParameterStrip leen de aquí para reaccionar al audio.
export const createAudioSlice: StateCreator<AudioState> = (set) => ({
  audioReady: false,
  audioPlaying: false,
  audioFileName: null,
  audioDuration: 0,
  audioCurrentTime: 0,
  beatDetected: false,
  audioFrame: null,

  setAudioReady: (audioReady: boolean) => set({ audioReady }),

  setAudioPlaying: (audioPlaying: boolean) => set({ audioPlaying }),

  setAudioFileName: (audioFileName: string | null) => set({ audioFileName }),

  setAudioDuration: (audioDuration: number) => set({ audioDuration }),

  setAudioCurrentTime: (audioCurrentTime: number) => set({ audioCurrentTime }),

  // setBeatDetected: marca el inicio de un transiente.
  // El canvas consume este valor en el siguiente frame de renderizado y
  // debe llamar a setBeatDetected(false) inmediatamente para que el pulso
  // dure exactamente un frame visual, no varios.
  setBeatDetected: (beatDetected: boolean) => set({ beatDetected }),

  // setAudioFrame: escribe los datos FFT y waveform del frame actual.
  // Es llamado por useAudioAnalyzer.ts en cada tick del requestAnimationFrame.
  setAudioFrame: (audioFrame: AudioFrame) => set({ audioFrame }),

  // Restaura el estado de audio a su valor inicial.
  // Usado al descargar un archivo o al cambiar al modo manos.
  resetAudio: () =>
    set({
      audioReady: false,
      audioPlaying: false,
      audioFileName: null,
      audioDuration: 0,
      audioCurrentTime: 0,
      beatDetected: false,
      audioFrame: null,
    }),
});