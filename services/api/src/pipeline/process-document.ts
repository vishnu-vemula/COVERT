import type { CovertDocument, ProcessingStage } from '@covert/shared';

import { AppError } from '../errors';
import { ExtractionError, type Extractor } from '../extraction/extractor';
import { transformExtraction } from '../extraction/transform';
import { hasMeaningfulText, prepareOcrText } from '../ocr/text';
import { OcrError, type OcrProvider } from '../ocr/types';
import type { ValidatedUpload } from '../upload/file-type';
import {
  estimateRecordBytes,
  MAX_RECORD_BYTES,
  type DocumentRepository,
  type NewDocument,
} from '../documents/repository';

export interface PipelineDeps {
  ocr: OcrProvider;
  extractor: Extractor;
  documents: DocumentRepository;
}

/** Facts about a run that are safe to log: counts and timings, never content. */
export interface PipelineMetrics {
  pages: number;
  ocrChars: number;
  ocrMs: number;
  structureMs: number;
  tables: number;
  rows: number;
}

const MAX_STORED_OCR_CHARS = 100_000;

/**
 * Upload → OCR → structuring → checks → save. `onStage` fires as each stage
 * actually begins; nothing here waits for presentation purposes.
 */
export async function processDocument(
  ownerUid: string,
  upload: ValidatedUpload,
  deps: PipelineDeps,
  onStage: (stage: ProcessingStage) => void,
  signal?: AbortSignal,
): Promise<{ document: CovertDocument; metrics: PipelineMetrics }> {
  onStage('reading');
  const ocrStarted = Date.now();
  const ocr = await deps.ocr
    .recognize(upload.kind === 'pdf' ? { kind: 'pdf', pdf: upload.pdf } : upload)
    .catch((error: unknown) => {
      if (error instanceof OcrError && error.kind === 'corrupt') {
        throw new AppError('CORRUPT_FILE', { cause: error });
      }
      throw new AppError('OCR_FAILED', { cause: error });
    });
  const ocrMs = Date.now() - ocrStarted;

  const text = prepareOcrText(ocr);
  if (!hasMeaningfulText(text.displayText)) throw new AppError('NO_TEXT_FOUND');
  throwIfAborted(signal);

  onStage('structuring');
  const structureStarted = Date.now();
  const extraction = await deps.extractor.extract(text.modelText, signal).catch((error: unknown) => {
    throw new AppError('EXTRACTION_FAILED', {
      cause: error,
      detail: error instanceof ExtractionError ? `Extraction ${error.kind}` : undefined,
    });
  });
  const structureMs = Date.now() - structureStarted;
  throwIfAborted(signal);

  onStage('checking');
  const result = transformExtraction(extraction);
  if (result.tables.length === 0) throw new AppError('NO_TABLE_FOUND');

  const warnings = [...result.warnings];
  const readPages = ocr.pages.length;
  if (ocr.totalPages > readPages) {
    warnings.push(`Only the first ${readPages} of ${ocr.totalPages} pages were read.`);
  }
  if (text.truncated) warnings.push('This document is long; only its first part was organized.');

  const record: NewDocument = {
    ownerUid,
    title: result.title,
    fileType: upload.mimeType,
    pageCount: readPages,
    summary: result.summary,
    warnings,
    tables: result.tables,
    ocrText: text.displayText.slice(0, MAX_STORED_OCR_CHARS),
  };
  if (estimateRecordBytes(record) > MAX_RECORD_BYTES) throw new AppError('DOCUMENT_TOO_LARGE');

  const document = await deps.documents.create(record);
  return {
    document,
    metrics: {
      pages: readPages,
      ocrChars: text.displayText.length,
      ocrMs,
      structureMs,
      tables: document.stats.tableCount,
      rows: document.stats.rowCount,
    },
  };
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new AppError('INVALID_REQUEST', { detail: 'Client disconnected' });
}
