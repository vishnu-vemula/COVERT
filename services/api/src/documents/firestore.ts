import {
  computeStats,
  DocumentListItemSchema,
  DocumentSchema,
  updateCellValue,
  type CovertDocument,
  type DocumentListItem,
  type DocumentStats,
  type MimeType,
  type Table,
} from '@covert/shared';
import { Timestamp, type DocumentData, type Firestore } from 'firebase-admin/firestore';

import { AppError, isAppError } from '../errors';
import {
  isOwnedBy,
  isValidDocumentId,
  type CellTarget,
  type DocumentRepository,
  type NewDocument,
} from './repository';

const COLLECTION = 'documents';
const LIST_FIELDS = [
  'ownerUid',
  'title',
  'fileType',
  'pageCount',
  'stats',
  'createdAt',
  'updatedAt',
];

interface StoredDocument {
  schemaVersion: 1;
  ownerUid: string;
  title: string;
  fileType: MimeType;
  pageCount: number;
  summary: string;
  warnings: string[];
  tables: Table[];
  stats: DocumentStats;
  ocrText: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirestoreDocuments implements DocumentRepository {
  constructor(private readonly db: Firestore) {}

  private get collection() {
    return this.db.collection(COLLECTION);
  }

  create(input: NewDocument): Promise<CovertDocument> {
    return guard(async () => {
      const ref = this.collection.doc();
      const now = Timestamp.now();
      const record: StoredDocument = {
        schemaVersion: 1,
        ...input,
        stats: computeStats(input.tables),
        createdAt: now,
        updatedAt: now,
      };
      await ref.set(record);
      return toDocument(ref.id, record);
    });
  }

  list(ownerUid: string, limit: number): Promise<DocumentListItem[]> {
    return guard(async () => {
      const snapshot = await this.collection
        .where('ownerUid', '==', ownerUid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .select(...LIST_FIELDS)
        .get();
      return snapshot.docs
        .filter((doc) => isOwnedBy(doc.data(), ownerUid))
        .map((doc) => toListItem(doc.id, doc.data()))
        .filter((item): item is DocumentListItem => item !== null);
    });
  }

  get(ownerUid: string, id: string): Promise<CovertDocument | null> {
    if (!isValidDocumentId(id)) return Promise.resolve(null);
    return guard(async () => {
      const snapshot = await this.collection.doc(id).get();
      const data = snapshot.data();
      if (!snapshot.exists || !isOwnedBy(data, ownerUid)) return null;
      return toDocument(id, data as StoredDocument);
    });
  }

  rename(ownerUid: string, id: string, title: string): Promise<DocumentListItem | null> {
    if (!isValidDocumentId(id)) return Promise.resolve(null);
    return guard(() =>
      this.db.runTransaction(async (tx) => {
        const ref = this.collection.doc(id);
        const snapshot = await tx.get(ref);
        const data = snapshot.data();
        if (!snapshot.exists || !isOwnedBy(data, ownerUid)) return null;
        const updatedAt = Timestamp.now();
        tx.update(ref, { title, updatedAt });
        return toListItem(id, { ...data, title, updatedAt });
      }),
    );
  }

  updateCell(ownerUid: string, id: string, target: CellTarget, value: string) {
    if (!isValidDocumentId(id)) return Promise.resolve(null);
    return guard(() =>
      this.db.runTransaction(async (tx) => {
        const ref = this.collection.doc(id);
        const snapshot = await tx.get(ref);
        const data = snapshot.data() as StoredDocument | undefined;
        if (!snapshot.exists || !data || !isOwnedBy(data, ownerUid)) return null;
        const tables = updateCellValue(data.tables, target, value);
        if (!tables) return 'no-cell' as const;
        const updatedAt = Timestamp.now();
        tx.update(ref, { tables, stats: computeStats(tables), updatedAt });
        return { updatedAt: updatedAt.toDate().toISOString() };
      }),
    );
  }

  delete(ownerUid: string, id: string): Promise<boolean> {
    if (!isValidDocumentId(id)) return Promise.resolve(false);
    return guard(() =>
      this.db.runTransaction(async (tx) => {
        const ref = this.collection.doc(id);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists || !isOwnedBy(snapshot.data(), ownerUid)) return false;
        tx.delete(ref);
        return true;
      }),
    );
  }

  deleteAll(ownerUid: string): Promise<number> {
    return guard(async () => {
      const snapshot = await this.collection.where('ownerUid', '==', ownerUid).select().get();
      const writer = this.db.bulkWriter();
      for (const doc of snapshot.docs) void writer.delete(doc.ref);
      await writer.close();
      return snapshot.size;
    });
  }
}

/** Converts storage failures into a safe, retryable error. */
async function guard<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isAppError(error)) throw error;
    throw new AppError('STORAGE_FAILED', { cause: error });
  }
}

function iso(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : new Date(0).toISOString();
}

function toListItem(id: string, data: DocumentData): DocumentListItem | null {
  const parsed = DocumentListItemSchema.safeParse({
    id,
    title: data.title,
    fileType: data.fileType,
    pageCount: data.pageCount,
    stats: data.stats,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  });
  return parsed.success ? parsed.data : null;
}

function toDocument(id: string, data: StoredDocument): CovertDocument {
  const parsed = DocumentSchema.safeParse({
    id,
    title: data.title,
    fileType: data.fileType,
    pageCount: data.pageCount,
    stats: data.stats,
    summary: data.summary,
    warnings: data.warnings,
    tables: data.tables,
    ocrText: data.ocrText,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  });
  if (!parsed.success) throw new AppError('INTERNAL', { detail: 'Stored document is malformed' });
  return parsed.data;
}
