import {
  API_PATHS,
  DocumentListItemSchema,
  DocumentListResponseSchema,
  DocumentResponseSchema,
  type UpdateCellRequest,
} from '@covert/shared';
import { z } from 'zod';

import { jsonBody, request } from './client';

export function listDocuments(limit = 100) {
  return request(`${API_PATHS.documents}?limit=${limit}`, DocumentListResponseSchema).then(
    (response) => response.documents,
  );
}

export function getDocument(id: string) {
  return request(API_PATHS.document(id), DocumentResponseSchema).then((response) => response.document);
}

export function renameDocument(id: string, title: string) {
  return request(
    API_PATHS.document(id),
    z.object({ document: DocumentListItemSchema }),
    { method: 'PATCH', ...jsonBody({ title }) },
  ).then((response) => response.document);
}

export function updateCell(id: string, change: UpdateCellRequest) {
  return request(API_PATHS.cells(id), z.object({ updatedAt: z.string() }), {
    method: 'PATCH',
    ...jsonBody(change),
  });
}

export function deleteDocument(id: string) {
  return request(API_PATHS.document(id), null, { method: 'DELETE' });
}

export function clearHistory() {
  return request(API_PATHS.documents, z.object({ deleted: z.number() }), { method: 'DELETE' });
}
