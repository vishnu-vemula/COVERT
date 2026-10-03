import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isOwnedBy, isValidDocumentId } from '../src/documents/repository';
import { transformExtraction } from '../src/extraction/transform';
import { loadExtraction } from './support/fixtures';
import { auth, createHarness, type Harness } from './support/harness';

describe('isOwnedBy', () => {
  it('matches only the exact owner', () => {
    expect(isOwnedBy({ ownerUid: 'alice' }, 'alice')).toBe(true);
    expect(isOwnedBy({ ownerUid: 'alice' }, 'bob')).toBe(false);
    expect(isOwnedBy({ ownerUid: 'alice' }, 'ALICE')).toBe(false);
  });

  it('never matches missing or empty owners', () => {
    expect(isOwnedBy(undefined, 'alice')).toBe(false);
    expect(isOwnedBy({}, 'alice')).toBe(false);
    expect(isOwnedBy({ ownerUid: '' }, '')).toBe(false);
    expect(isOwnedBy({ ownerUid: 42 }, '42')).toBe(false);
  });
});

describe('isValidDocumentId', () => {
  it('rejects path-like ids', () => {
    expect(isValidDocumentId('aB3_x-9')).toBe(true);
    expect(isValidDocumentId('../users')).toBe(false);
    expect(isValidDocumentId('a/b')).toBe(false);
    expect(isValidDocumentId('')).toBe(false);
  });
});

describe('document ownership over HTTP', () => {
  let harness: Harness;
  let aliceDoc: string;

  beforeEach(async () => {
    harness = await createHarness();
    const { title, summary, tables, warnings } = transformExtraction(loadExtraction('simple-list'));
    const created = await harness.documents.create({
      ownerUid: 'alice',
      title,
      summary,
      tables,
      warnings,
      fileType: 'image/jpeg',
      pageCount: 1,
      ocrText: 'Grocery list',
    });
    aliceDoc = created.id;
  });
  afterEach(() => harness.app.close());

  const request = (method: 'GET' | 'PATCH' | 'DELETE', url: string, uid: string, payload?: object) =>
    harness.app.inject({ method, url, headers: auth(uid), payload });

  it('lets the owner read, rename, edit and delete', async () => {
    expect((await request('GET', `/v1/documents/${aliceDoc}`, 'alice')).statusCode).toBe(200);

    const renamed = await request('PATCH', `/v1/documents/${aliceDoc}`, 'alice', { title: 'Groceries' });
    expect(renamed.json().document.title).toBe('Groceries');

    const edited = await request('PATCH', `/v1/documents/${aliceDoc}/cells`, 'alice', {
      tableId: 't1',
      rowId: 'r3',
      columnId: 'c2',
      value: '500ml',
    });
    expect(edited.statusCode).toBe(200);
    const after = (await request('GET', `/v1/documents/${aliceDoc}`, 'alice')).json().document;
    expect(after.tables[0].rows[2].cells[1]).toMatchObject({ value: '500ml', edited: true });

    expect((await request('DELETE', `/v1/documents/${aliceDoc}`, 'alice')).statusCode).toBe(204);
    expect((await request('GET', `/v1/documents/${aliceDoc}`, 'alice')).statusCode).toBe(404);
  });

  it('hides another user’s document behind 404 for every operation', async () => {
    const attempts = [
      await request('GET', `/v1/documents/${aliceDoc}`, 'mallory'),
      await request('PATCH', `/v1/documents/${aliceDoc}`, 'mallory', { title: 'Mine now' }),
      await request('PATCH', `/v1/documents/${aliceDoc}/cells`, 'mallory', {
        tableId: 't1',
        rowId: 'r1',
        columnId: 'c1',
        value: 'x',
      }),
      await request('DELETE', `/v1/documents/${aliceDoc}`, 'mallory'),
    ];
    for (const response of attempts) {
      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe('NOT_FOUND');
    }
    const untouched = await harness.documents.get('alice', aliceDoc);
    expect(untouched?.title).toBe('Grocery list — week 41');
    expect(untouched?.tables[0]?.rows[0]?.cells[0]?.value).toBe('Basmati rice');
  });

  it('lists and clears only the caller’s own documents', async () => {
    const mine = await request('GET', '/v1/documents', 'mallory');
    expect(mine.json()).toEqual({ documents: [] });

    const cleared = await request('DELETE', '/v1/documents', 'mallory');
    expect(cleared.json()).toEqual({ deleted: 0 });
    expect(await harness.documents.get('alice', aliceDoc)).not.toBeNull();

    const aliceList = await request('GET', '/v1/documents', 'alice');
    expect(aliceList.json().documents).toHaveLength(1);
    expect(aliceList.json().documents[0]).not.toHaveProperty('tables');
  });

  it('ignores any owner id supplied in the request body', async () => {
    const response = await request('PATCH', `/v1/documents/${aliceDoc}`, 'mallory', {
      title: 'Hijack',
      ownerUid: 'alice',
    });
    expect(response.statusCode).toBe(404);
  });

  it('rejects edits to cells that do not exist', async () => {
    const response = await request('PATCH', `/v1/documents/${aliceDoc}/cells`, 'alice', {
      tableId: 't1',
      rowId: 'r99',
      columnId: 'c1',
      value: 'x',
    });
    expect(response.statusCode).toBe(404);
  });

  it('validates rename input', async () => {
    const response = await request('PATCH', `/v1/documents/${aliceDoc}`, 'alice', { title: '   ' });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');
  });
});
