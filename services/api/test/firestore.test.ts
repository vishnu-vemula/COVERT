import { FieldPath, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';

import { FirestoreDocuments } from '../src/documents/firestore';
import { decodeCursor, encodeCursor } from '../src/documents/cursor';

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

describe('Firestore history pagination', () => {
  it('orders timestamp ties by id and resumes with the exact timestamp even if the document is deleted', async () => {
    const createdAt = new Timestamp(1_792_230_000, 123_456_789);
    const docs = ['c', 'b', 'a'].map((id) => ({
      id,
      data: () => ({
        ownerUid: 'alice',
        title: id,
        fileType: 'application/pdf',
        pageCount: 1,
        stats: { tableCount: 0, rowCount: 0, columnCount: 0, uncertainCount: 0 },
        createdAt,
        updatedAt: createdAt,
      }),
    }));
    const query = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn(async () => ({ docs, size: docs.length })),
    };
    const repository = new FirestoreDocuments({ collection: () => query } as unknown as Firestore);
    const page = await repository.list('alice', 2);
    expect(page.documents.map((document) => document.id)).toEqual(['c', 'b']);
    expect(query.where).toHaveBeenCalledWith('ownerUid', '==', 'alice');
    expect(query.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(query.orderBy).toHaveBeenCalledWith(FieldPath.documentId(), 'desc');
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(decodeCursor(page.nextCursor!)).toEqual({
      id: 'b',
      seconds: createdAt.seconds,
      nanoseconds: createdAt.nanoseconds,
    });
    await repository.list(
      'alice',
      2,
      encodeCursor({
        id: 'deleted',
        seconds: createdAt.seconds,
        nanoseconds: createdAt.nanoseconds,
      }),
    );
    expect(query.startAfter).toHaveBeenCalledWith(createdAt, 'deleted');
  });
});
