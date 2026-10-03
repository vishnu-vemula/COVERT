import { z } from 'zod';

import { DocumentListItemSchema, DocumentSchema } from './document';
import { ApiErrorSchema } from './errors';
import { LIMITS } from './limits';

/**
 * HTTP contract between the mobile app and the API.
 *
 * Processing streams newline-delimited JSON events so the client can show the
 * stage the server is actually in. Upload progress is observed client-side.
 */

export const API_PATHS = {
  health: '/healthz',
  documents: '/v1/documents',
  document: (id: string) => `/v1/documents/${encodeURIComponent(id)}`,
  cells: (id: string) => `/v1/documents/${encodeURIComponent(id)}/cells`,
} as const;

/** Multipart field name for uploaded pages. */
export const UPLOAD_FIELD = 'file';

export const PROCESSING_STAGES = ['reading', 'structuring', 'checking'] as const;
export const ProcessingStageSchema = z.enum(PROCESSING_STAGES);
export type ProcessingStage = z.infer<typeof ProcessingStageSchema>;

export const ProcessEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stage'), stage: ProcessingStageSchema }),
  z.object({ type: z.literal('ready'), document: DocumentSchema }),
  z.object({ type: z.literal('error'), error: ApiErrorSchema }),
]);
export type ProcessEvent = z.infer<typeof ProcessEventSchema>;

export const DocumentListResponseSchema = z.object({
  documents: z.array(DocumentListItemSchema),
});
export type DocumentListResponse = z.infer<typeof DocumentListResponseSchema>;

export const DocumentResponseSchema = z.object({ document: DocumentSchema });
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;

export const RenameRequestSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.maxTitleLength),
});
export type RenameRequest = z.infer<typeof RenameRequestSchema>;

export const UpdateCellRequestSchema = z.object({
  tableId: z.string().min(1),
  rowId: z.string().min(1),
  columnId: z.string().min(1),
  value: z.string().max(LIMITS.maxCellLength),
});
export type UpdateCellRequest = z.infer<typeof UpdateCellRequestSchema>;
