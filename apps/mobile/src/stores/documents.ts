import {
  computeStats,
  updateCellValue,
  type ApiError,
  type CovertDocument,
  type DocumentListItem,
  type UpdateCellRequest,
} from '@covert/shared';
import { create } from 'zustand';

import * as api from '@/lib/api/documents';
import { toApiError } from '@/lib/api/client';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface DocumentsState {
  list: DocumentListItem[];
  listState: LoadState;
  listError: ApiError | null;
  /** Full documents opened in this session, by id. */
  documents: Record<string, CovertDocument>;

  loadList: () => Promise<void>;
  loadDocument: (id: string) => Promise<CovertDocument>;
  /** Called with a freshly processed document so the result opens instantly. */
  add: (document: CovertDocument) => void;
  /** Applies the edit immediately, saves it, and rolls back if saving fails. */
  editCell: (id: string, change: UpdateCellRequest) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  reset: () => void;
}

function toListItem(document: CovertDocument): DocumentListItem {
  const { id, title, fileType, pageCount, createdAt, updatedAt, stats } = document;
  return { id, title, fileType, pageCount, createdAt, updatedAt, stats };
}

const initial = {
  list: [] as DocumentListItem[],
  listState: 'idle' as LoadState,
  listError: null,
  documents: {} as Record<string, CovertDocument>,
};

export const useDocuments = create<DocumentsState>((set, get) => ({
  ...initial,

  loadList: async () => {
    set({ listState: 'loading', listError: null });
    try {
      const list = await api.listDocuments();
      set({ list, listState: 'ready' });
    } catch (error) {
      set({ listState: 'error', listError: toApiError(error) });
    }
  },

  loadDocument: async (id) => {
    const document = await api.getDocument(id);
    set((state) => ({ documents: { ...state.documents, [id]: document } }));
    return document;
  },

  add: (document) =>
    set((state) => ({
      documents: { ...state.documents, [document.id]: document },
      list: [toListItem(document), ...state.list.filter((item) => item.id !== document.id)],
    })),

  editCell: async (id, change) => {
    const before = get().documents[id];
    if (!before) return;
    const tables = updateCellValue(before.tables, change, change.value);
    if (!tables) return;
    const optimistic = { ...before, tables, stats: computeStats(tables) };
    set((state) => ({ documents: { ...state.documents, [id]: optimistic } }));
    try {
      const { updatedAt } = await api.updateCell(id, change);
      set((state) => {
        const current = state.documents[id];
        return {
          documents: current
            ? { ...state.documents, [id]: { ...current, updatedAt } }
            : state.documents,
          list: state.list.map((item) =>
            item.id === id ? { ...item, updatedAt, stats: optimistic.stats } : item,
          ),
        };
      });
    } catch (error) {
      set((state) => ({ documents: { ...state.documents, [id]: before } }));
      throw error;
    }
  },

  rename: async (id, title) => {
    const item = await api.renameDocument(id, title);
    set((state) => {
      const current = state.documents[id];
      return {
        list: state.list.map((entry) => (entry.id === id ? item : entry)),
        documents: current
          ? { ...state.documents, [id]: { ...current, title: item.title } }
          : state.documents,
      };
    });
  },

  remove: async (id) => {
    await api.deleteDocument(id);
    set((state) => {
      const documents = { ...state.documents };
      delete documents[id];
      return { documents, list: state.list.filter((item) => item.id !== id) };
    });
  },

  clearAll: async () => {
    await api.clearHistory();
    set({ list: [], documents: {}, listState: 'ready' });
  },

  reset: () => set(initial),
}));
