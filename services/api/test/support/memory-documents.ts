import {
  computeStats,
  updateCellValue,
  type CovertDocument,
  type DocumentListItem,
} from '@covert/shared';

import {
  isOwnedBy,
  type CellTarget,
  type DocumentRepository,
  type NewDocument,
} from '../../src/documents/repository';

type Stored = CovertDocument & { ownerUid: string };

/** In-memory repository with the same ownership semantics as the Firestore one. Tests only. */
export class MemoryDocuments implements DocumentRepository {
  readonly records = new Map<string, Stored>();
  private nextId = 1;
  failWith: Error | null = null;

  private check(): void {
    if (this.failWith) throw this.failWith;
  }

  async create(input: NewDocument): Promise<CovertDocument> {
    this.check();
    const now = new Date(Date.UTC(2026, 9, 1, 10, 0, this.nextId)).toISOString();
    const id = `doc${this.nextId++}`;
    const { ownerUid, ...rest } = input;
    const record: Stored = {
      id,
      ownerUid,
      ...rest,
      stats: computeStats(input.tables),
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, record);
    return strip(record);
  }

  async list(ownerUid: string, limit: number): Promise<DocumentListItem[]> {
    this.check();
    return [...this.records.values()]
      .filter((record) => isOwnedBy(record, ownerUid))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(({ id, title, fileType, pageCount, stats, createdAt, updatedAt }) => ({
        id,
        title,
        fileType,
        pageCount,
        stats,
        createdAt,
        updatedAt,
      }));
  }

  async get(ownerUid: string, id: string): Promise<CovertDocument | null> {
    this.check();
    const record = this.records.get(id);
    return record && isOwnedBy(record, ownerUid) ? strip(record) : null;
  }

  async rename(ownerUid: string, id: string, title: string): Promise<DocumentListItem | null> {
    this.check();
    const record = this.records.get(id);
    if (!record || !isOwnedBy(record, ownerUid)) return null;
    record.title = title;
    const { id: docId, fileType, pageCount, stats, createdAt, updatedAt } = record;
    return { id: docId, title, fileType, pageCount, stats, createdAt, updatedAt };
  }

  async updateCell(ownerUid: string, id: string, target: CellTarget, value: string) {
    this.check();
    const record = this.records.get(id);
    if (!record || !isOwnedBy(record, ownerUid)) return null;
    const tables = updateCellValue(record.tables, target, value);
    if (!tables) return 'no-cell' as const;
    record.tables = tables;
    record.stats = computeStats(tables);
    return { updatedAt: record.updatedAt };
  }

  async delete(ownerUid: string, id: string): Promise<boolean> {
    this.check();
    const record = this.records.get(id);
    if (!record || !isOwnedBy(record, ownerUid)) return false;
    return this.records.delete(id);
  }

  async deleteAll(ownerUid: string): Promise<number> {
    this.check();
    let count = 0;
    for (const [id, record] of this.records) {
      if (isOwnedBy(record, ownerUid)) {
        this.records.delete(id);
        count += 1;
      }
    }
    return count;
  }
}

function strip(record: Stored): CovertDocument {
  const { ownerUid: _owner, ...document } = record;
  return structuredClone(document);
}
