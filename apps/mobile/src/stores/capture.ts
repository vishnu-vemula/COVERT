import { LIMITS } from '@covert/shared';
import { create } from 'zustand';

/** A photographed or picked page, already normalized to JPEG or PNG. */
export interface CapturedPage {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg' | 'image/png';
  source: 'camera' | 'library' | 'files';
}

export interface PickedPdf {
  uri: string;
  name: string;
  size: number;
}

interface CaptureState {
  pages: CapturedPage[];
  pdf: PickedPdf | null;
  /** True when the camera was opened to add another page to the current set. */
  addingPage: boolean;
  setPages: (pages: CapturedPage[]) => void;
  addPage: (page: CapturedPage) => void;
  replacePage: (index: number, page: CapturedPage) => void;
  removePage: (index: number) => void;
  setPdf: (pdf: PickedPdf) => void;
  setAddingPage: (value: boolean) => void;
  reset: () => void;
}

export const useCapture = create<CaptureState>((set) => ({
  pages: [],
  pdf: null,
  addingPage: false,
  setPages: (pages) => set({ pages: pages.slice(0, LIMITS.maxImagePages), pdf: null }),
  addPage: (page) =>
    set((state) => ({ pages: [...state.pages, page].slice(0, LIMITS.maxImagePages), pdf: null })),
  replacePage: (index, page) =>
    set((state) => ({ pages: state.pages.map((existing, i) => (i === index ? page : existing)) })),
  removePage: (index) => set((state) => ({ pages: state.pages.filter((_, i) => i !== index) })),
  setPdf: (pdf) => set({ pdf, pages: [] }),
  setAddingPage: (addingPage) => set({ addingPage }),
  reset: () => set({ pages: [], pdf: null, addingPage: false }),
}));

export function hasInput(state: Pick<CaptureState, 'pages' | 'pdf'>): boolean {
  return state.pdf !== null || state.pages.length > 0;
}
