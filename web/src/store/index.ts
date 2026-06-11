import { create } from "zustand";
import { createFieldSlice } from "@/store/slices/fieldSlice";
import { createAudioSlice } from "@/store/slices/audioSlice";
import { createAppSlice }   from "@/store/slices/appSlice";
import { FieldState }       from "@/store/types/field.types";
import { AudioState }       from "@/store/types/audio.types";
import { AppState }         from "@/store/types/app.types";

// LumyraStore sin el dominio de manos — enfocado en audio y campo electromagnético
export type LumyraStore = FieldState & AudioState & AppState;

export const useLumyraStore = create<LumyraStore>((...args) => ({
  ...createFieldSlice(...args),
  ...createAudioSlice(...args),
  ...createAppSlice(...args),
}));

export type { FieldParams, FieldSource, FieldState } from "@/store/types/field.types";
export type { AudioFrame, AudioBands, AudioState }   from "@/store/types/audio.types";
export type { AppMode, AppConfig, AppState }         from "@/store/types/app.types";