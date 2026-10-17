import { DocumentListResponseSchema } from '@covert/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor } from '../src/documents/cursor';
import { auth, createHarness, type Harness } from './support/harness';

let harness: Harness | undefined;
afterEach(async () => harness?.app.close());

describe('complete document history', () => {
  it('pages beyond 100 records with tied timestamps without losing or repeating documents', async () => {
    harness = await createHarness();
    const expected = new Set<string>();
    for (let index = 0; index < 205; index += 1) {
      const document = await harness.documents.create({
        ownerUid: index % 10 === 0 ? 'bob' : 'alice',
        title: `Document ${index}`,
        summary: '',
        warnings: [],
        tables: [],
        ocrText: '',
        fileType: 'application/pdf',
        pageCount: 1,
      });
      harness.documents.records.get(document.id)!.createdAt = '2026-10-17T10:00:00.000Z';
      if (index % 10 !== 0) expected.add(document.id);
    }
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const response = await harness.app.inject({
        method: 'GET',
        url: `/v1/documents?limit=50${cursor ? `&cursor=${cursor}` : ''}`,
        headers: auth('alice'),
      });
      expect(response.statusCode).toBe(200);
      const page = DocumentListResponseSchema.parse(response.json());
      expect(page.documents.length).toBeLessThanOrEqual(50);
      ids.push(...page.documents.map((document) => document.id));
      cursor = page.nextCursor;
      // A continuation must survive deletion of the last record on its page.
      if (cursor) await harness.documents.delete('alice', page.documents.at(-1)!.id);
    } while (cursor);
    expect(new Set(ids)).toEqual(expected);
    expect(ids).toHaveLength(expected.size);
  });

  it('rejects malformed cursors as client errors', async () => {
    harness = await createHarness();
    for (const cursor of [
      'not-a-cursor',
      encodeCursor({ id: '../bad', seconds: 1, nanoseconds: 0 }),
    ]) {
      const response = await harness.app.inject({
        method: 'GET',
        url: `/v1/documents?cursor=${cursor}`,
        headers: auth('alice'),
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('INVALID_REQUEST');
    }
  });

  it('preserves timestamp precision in continuation tokens', () => {
    const cursor = { id: 'aB123', seconds: 1_792_230_000, nanoseconds: 123_456_789 };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });
});
