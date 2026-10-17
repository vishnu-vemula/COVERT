import { z } from 'zod';

import { AppError } from '../errors';

const CursorSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  seconds: z.number().int().min(-62_135_596_800).max(253_402_300_799),
  nanoseconds: z.number().int().min(0).max(999_999_999),
});

/** Preserve Firestore's nanosecond precision and break timestamp ties by id. */
export type DocumentCursor = z.infer<typeof CursorSchema>;

export function encodeCursor(cursor: DocumentCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(value: string): DocumentCursor {
  try {
    if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('encoding');
    return CursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
  } catch {
    throw new AppError('INVALID_REQUEST', { detail: 'Invalid history cursor' });
  }
}
