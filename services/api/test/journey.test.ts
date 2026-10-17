import { DocumentResponseSchema, toCsv } from '@covert/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { FIXTURE_NAMES, JPEG_BYTES, loadOcrText, loadRawExtraction } from './support/fixtures';
import {
  auth,
  createHarness,
  FakeOcr,
  multipart,
  ocrOf,
  parseEvents,
  type Harness,
} from './support/harness';

let harness: Harness | undefined;
afterEach(async () => harness?.app.close());

describe('HTTP document journey with fixture providers', () => {
  it.each(FIXTURE_NAMES)(
    'converts, reopens, reviews, renames, exports and clears %s privately',
    async (name) => {
      harness = await createHarness({
        ocr: new FakeOcr(ocrOf(loadOcrText(name))),
        complete: async () => loadRawExtraction(name),
      });
      const upload = multipart([{ buffer: JPEG_BYTES }]);
      const converted = await harness.app.inject({
        method: 'POST',
        url: '/v1/documents',
        payload: upload.payload,
        headers: { ...upload.headers, ...auth('alice') },
      });
      const event = parseEvents(converted.body).at(-1);
      expect(event?.type).toBe('ready');
      if (event?.type !== 'ready') throw new Error('Conversion did not complete');
      const id = event.document.id;
      const path = `/v1/documents/${id}`;
      const request = (
        method: 'GET' | 'PATCH' | 'DELETE',
        url = path,
        payload?: object,
        uid = 'alice',
      ) => harness!.app.inject({ method, url, payload, headers: auth(uid) });

      const reopened = DocumentResponseSchema.parse((await request('GET')).json()).document;
      expect(reopened.tables).toEqual(event.document.tables);
      const table = reopened.tables[0]!;
      const row = table.rows[0]!;
      const cell = row.cells[0]!;
      const changed = 'Reviewed, "verified" ₹42';
      const edit = { tableId: table.id, rowId: row.id, columnId: cell.columnId, value: changed };
      expect((await request('PATCH', `${path}/cells`, edit)).statusCode).toBe(200);
      expect((await request('PATCH', path, { title: 'Reviewed document' })).statusCode).toBe(200);

      const reviewed = DocumentResponseSchema.parse((await request('GET')).json()).document;
      expect(reviewed.title).toBe('Reviewed document');
      expect(reviewed.tables[0]!.rows[0]!.cells[0]).toMatchObject({
        value: changed,
        edited: true,
        uncertain: false,
      });
      expect(toCsv(reviewed.tables[0]!)).toContain('"Reviewed, ""verified"" ₹42"');
      expect((await request('GET', '/v1/documents')).json().documents[0].title).toBe(
        'Reviewed document',
      );

      for (const [method, url, payload] of [
        ['GET', path, undefined],
        ['PATCH', path, { title: 'Hijacked' }],
        ['PATCH', `${path}/cells`, edit],
        ['DELETE', path, undefined],
      ] as const) {
        expect((await request(method, url, payload, 'bob')).statusCode).toBe(404);
      }
      expect((await request('GET', '/v1/documents', undefined, 'bob')).json()).toEqual({
        documents: [],
      });
      expect((await request('DELETE', '/v1/documents', undefined, 'bob')).json()).toEqual({
        deleted: 0,
      });
      expect((await request('GET')).statusCode).toBe(200);

      expect((await request('DELETE', '/v1/documents')).json()).toEqual({ deleted: 1 });
      expect((await request('GET')).statusCode).toBe(404);
      expect((await request('GET', '/v1/documents')).json()).toEqual({ documents: [] });
    },
  );
});
