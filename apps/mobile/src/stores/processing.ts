import type { ApiError, ProcessingStage } from '@covert/shared';
import { create } from 'zustand';

import { toApiError } from '@/lib/api/client';
import {
  CancelledError,
  processDocument,
  type ProcessJob,
  type UploadFile,
} from '@/lib/api/process';

import { useCapture } from './capture';
import { useDocuments } from './documents';

export type JobStage = 'uploading' | ProcessingStage | 'ready';
export const JOB_STAGES: readonly JobStage[] = [
  'uploading',
  'reading',
  'structuring',
  'checking',
  'ready',
];

interface ProcessingState {
  status: 'idle' | 'running' | 'ready' | 'error';
  stage: JobStage;
  upload: { sent: number; total: number } | null;
  error: ApiError | null;
  documentId: string | null;
  start: () => void;
  cancel: () => void;
  reset: () => void;
}

let job: ProcessJob | null = null;

const idle = {
  status: 'idle' as const,
  stage: 'uploading' as JobStage,
  upload: null,
  error: null,
  documentId: null,
};

function filesToUpload(): UploadFile[] {
  const { pages, pdf } = useCapture.getState();
  if (pdf) return [{ uri: pdf.uri, name: pdf.name || 'document.pdf', mimeType: 'application/pdf' }];
  return pages.map((page, index) => ({
    uri: page.uri,
    name: `page-${index + 1}.${page.mimeType === 'image/png' ? 'png' : 'jpg'}`,
    mimeType: page.mimeType,
  }));
}

/** One conversion at a time. State reflects only what the server has reported. */
export const useProcessing = create<ProcessingState>((set) => ({
  ...idle,

  start: () => {
    job?.cancel();
    const files = filesToUpload();
    if (files.length === 0) return;
    set({ ...idle, status: 'running' });

    const current = processDocument(files, {
      onUploadProgress: (sent, total) => {
        if (job === current) set({ upload: { sent, total } });
      },
      onStage: (stage) => {
        if (job === current) set({ stage });
      },
    });
    job = current;

    current.result
      .then((document) => {
        if (job !== current) return;
        useDocuments.getState().add(document);
        set({ status: 'ready', stage: 'ready', documentId: document.id });
      })
      .catch((error: unknown) => {
        if (job !== current || error instanceof CancelledError) return;
        set({ status: 'error', error: toApiError(error) });
      });
  },

  cancel: () => {
    const current = job;
    job = null;
    current?.cancel();
    set(idle);
  },

  reset: () => {
    job = null;
    set(idle);
  },
}));
