import type { Firestore } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';

import { FirestoreDocuments } from '../src/documents/firestore';

function deletionHarness(count: number, failId?: string) {
  const records = new Map(
    Array.from({ length: count }, (_, index) => [`doc${index}`, { ownerUid: 'alice' }]),
  );
  records.set('bobs-document', { ownerUid: 'bob' });
  const batches: number[] = [];
  const where = vi.fn((field: string, operator: string, uid: string) => {
    expect([field, operator]).toEqual(['ownerUid', '==']);
    return {
      limit: (limit: number) => ({
        select: () => ({
          get: async () => {
            const docs = [...records]
              .filter(([, record]) => record.ownerUid === uid)
              .slice(0, limit)
              .map(([id]) => ({ ref: { id } }));
            batches.push(docs.length);
            return { docs, size: docs.length, empty: docs.length === 0 };
          },
        }),
      }),
    };
  });
  const close = vi.fn(async () => undefined);
  const db = {
    collection: () => ({ where }),
    bulkWriter: () => ({
      delete: async ({ id }: { id: string }) => {
        if (id === failId) throw new Error('permission denied');
        records.delete(id);
      },
      close,
    }),
  } as unknown as Firestore;
  return { repository: new FirestoreDocuments(db), records, batches, close };
}

describe('Firestore history deletion', () => {
  it('clears large histories in bounded batches and preserves other accounts', async () => {
    const { repository, records, batches, close } = deletionHarness(601);
    await expect(repository.deleteAll('alice')).resolves.toBe(601);
    expect([...records.keys()]).toEqual(['bobs-document']);
    expect(batches).toEqual([500, 101, 0]);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('reports failed deletes even when the writer closes successfully', async () => {
    const { repository, records, close } = deletionHarness(3, 'doc1');
    await expect(repository.deleteAll('alice')).rejects.toMatchObject({ code: 'STORAGE_FAILED' });
    expect(close).toHaveBeenCalledOnce();
    expect(records.has('doc1')).toBe(true);
    expect(records.has('bobs-document')).toBe(true);
  });
});
