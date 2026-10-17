import {
  API_PATHS,
  DocumentListItemSchema,
  DocumentListResponseSchema,
  DocumentResponseSchema,
  type DocumentListItem,
  type UpdateCellRequest,
} from '@covert/shared';
import { z } from 'zod';

import { jsonBody, request } from './client';

export async function listDocuments(limit = 100): Promise<DocumentListItem[]> {
  const documents = new Map<string, DocumentListItem>();
  let cursor: string | undefined;
  do {
    const query = `limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const page = await request(`${API_PATHS.documents}?${query}`, DocumentListResponseSchema);
    for (const document of page.documents) documents.set(document.id, document);
    cursor = page.nextCursor;
  } while (cursor);
  return [...documents.values()];
}

export function getDocument(id: string) {
  return request(API_PATHS.document(id), DocumentResponseSchema).then(
    (response) => response.document,
  );
}

export function renameDocument(id: string, title: string) {
  return request(API_PATHS.document(id), z.object({ document: DocumentListItemSchema }), {
    method: 'PATCH',
    ...jsonBody({ title }),
  }).then((response) => response.document);
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
