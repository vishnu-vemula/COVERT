import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SPEECH_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type SpeechRate = (typeof SPEECH_RATES)[number];

interface SettingsState {
  speechRate: SpeechRate;
  readColumnNames: boolean;
  /** Spoken stage changes and haptics while a document is processed. */
  audioFeedback: boolean;
  setSpeechRate: (rate: SpeechRate) => void;
  setReadColumnNames: (value: boolean) => void;
  setAudioFeedback: (value: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      speechRate: 1,
      readColumnNames: true,
      audioFeedback: true,
      setSpeechRate: (speechRate) => set({ speechRate }),
      setReadColumnNames: (readColumnNames) => set({ readColumnNames }),
      setAudioFeedback: (audioFeedback) => set({ audioFeedback }),
    }),
    {
      name: 'covert.settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ speechRate, readColumnNames, audioFeedback }) => ({
        speechRate,
        readColumnNames,
        audioFeedback,
      }),
    },
  ),
);

export function rateLabel(rate: number): string {
  return `${rate}×`;
}
