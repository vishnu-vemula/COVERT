import { LIMITS } from '@covert/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { ConversionLimiter } from '../src/pipeline/conversion-limiter';
import { ExtractionError } from '../src/extraction/extractor';
import { OcrError } from '../src/ocr/types';
import { JPEG_BYTES, loadOcrText, loadRawExtraction, PDF_BYTES, PNG_BYTES } from './support/fixtures';
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
afterEach(async () => {
  await harness?.app.close();
  harness = undefined;
});

async function upload(h: Harness, files: Parameters<typeof multipart>[0], uid = 'alice') {
  const { payload, headers } = multipart(files);
  return h.app.inject({
    method: 'POST',
    url: '/v1/documents',
    headers: { ...headers, ...auth(uid) },
    payload,
  });
}

describe('POST /v1/documents', () => {
  it('streams real stages and returns the saved document', async () => {
    harness = await createHarness();
    const response = await upload(harness, [{ buffer: JPEG_BYTES, contentType: 'image/jpeg' }]);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/x-ndjson');
    const events = parseEvents(response.body);
    expect(events.slice(0, 3)).toEqual([
      { type: 'stage', stage: 'reading' },
      { type: 'stage', stage: 'structuring' },
      { type: 'stage', stage: 'checking' },
    ]);
    const ready = events[3];
    expect(ready?.type).toBe('ready');
    if (ready?.type !== 'ready') return;
    expect(ready.document).toMatchObject({
      title: 'Northwind Studio Supply — Invoice INV-2024-0193',
      fileType: 'image/jpeg',
      pageCount: 1,
      stats: { tableCount: 3, rowCount: 11, columnCount: 5, uncertainCount: 0 },
    });
    expect(ready.document.ocrText).toContain('INV-2024-0193');

    const stored = await harness.documents.get('alice', ready.document.id);
    expect(stored?.tables).toEqual(ready.document.tables);
  });

  it('identifies files by content even when the declared type is wrong', async () => {
    harness = await createHarness();
    const response = await upload(harness, [
      { buffer: PDF_BYTES, filename: 'scan.jpg', contentType: 'image/jpeg' },
    ]);
    const ready = parseEvents(response.body).at(-1);
    expect(ready).toMatchObject({ type: 'ready', document: { fileType: 'application/pdf' } });
  });

  it('accepts several photographed pages', async () => {
    harness = await createHarness();
    const response = await upload(harness, [{ buffer: JPEG_BYTES }, { buffer: PNG_BYTES }]);
    expect(parseEvents(response.body).at(-1)?.type).toBe('ready');
  });

  it.each([
    ['unsupported files', [{ buffer: Buffer.from('GIF89a not an accepted file') }], 415, 'UNSUPPORTED_FILE'],
    ['damaged files', [{ buffer: PDF_BYTES.subarray(0, 24) }], 422, 'CORRUPT_FILE'],
    ['empty uploads', [], 400, 'INVALID_REQUEST'],
    [
      'oversized files',
      [{ buffer: Buffer.concat([JPEG_BYTES, Buffer.alloc(LIMITS.maxFileBytes + 1)]) }],
      413,
      'FILE_TOO_LARGE',
    ],
    [
      'too many pages',
      Array.from({ length: LIMITS.maxImagePages + 1 }, () => ({ buffer: JPEG_BYTES })),
      400,
      'TOO_MANY_FILES',
    ],
  ] as const)('rejects %s before processing', async (_label, files, status, code) => {
    harness = await createHarness();
    const response = await upload(harness, [...files]);
    expect(response.statusCode).toBe(status);
    expect(response.json().error.code).toBe(code);
    expect(harness.ocr.calls).toBe(0);
  });

  it('rejects requests that are not multipart', async () => {
    harness = await createHarness();
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/documents',
      headers: auth('alice'),
      payload: { file: 'not a file' },
    });
    expect(response.statusCode).toBe(400);
  });

  it.each([
    ['blank OCR output', new FakeOcr(ocrOf('  \n ')), 'NO_TEXT_FOUND'],
    ['stray marks only', new FakeOcr(ocrOf('. , |')), 'NO_TEXT_FOUND'],
    ['an OCR provider failure', new FakeOcr(new OcrError('failed')), 'OCR_FAILED'],
    ['an image the provider cannot decode', new FakeOcr(new OcrError('corrupt')), 'CORRUPT_FILE'],
    ['an unexpected OCR exception', new FakeOcr(new Error('socket hang up')), 'OCR_FAILED'],
  ])('reports %s as a stream error', async (_label, ocr, code) => {
    harness = await createHarness({ ocr });
    const response = await upload(harness, [{ buffer: JPEG_BYTES }]);
    const events = parseEvents(response.body);
    expect(events[0]).toEqual({ type: 'stage', stage: 'reading' });
    expect(events.at(-1)).toMatchObject({ type: 'error', error: { code } });
    expect(harness.completions.count).toBe(0);
    expect(harness.documents.records.size).toBe(0);
  });

  it('retries invalid structured output once, then fails clearly', async () => {
    harness = await createHarness({ complete: async () => ({ tables: 'nope' }) });
    const response = await upload(harness, [{ buffer: JPEG_BYTES }]);
    expect(parseEvents(response.body).at(-1)).toEqual({
      type: 'error',
      error: {
        code: 'EXTRACTION_FAILED',
        message: 'The text was read, but organizing it into a table failed. Try again.',
        retryable: true,
      },
    });
    expect(harness.completions.count).toBe(2);
  });

  it('recovers when the retry succeeds', async () => {
    const outputs: unknown[] = [null, loadRawExtraction('simple-list')];
    harness = await createHarness({ complete: async () => outputs.shift() });
    const response = await upload(harness, [{ buffer: JPEG_BYTES }]);
    expect(parseEvents(response.body).at(-1)?.type).toBe('ready');
    expect(harness.completions.count).toBe(2);
  });

  it('reports model provider failures without retrying', async () => {
    harness = await createHarness({
      complete: async () => {
        throw new ExtractionError('provider');
      },
    });
    const response = await upload(harness, [{ buffer: JPEG_BYTES }]);
    expect(parseEvents(response.body).at(-1)).toMatchObject({
      type: 'error',
      error: { code: 'EXTRACTION_FAILED' },
    });
    expect(harness.completions.count).toBe(1);
  });

  it('reports documents with nothing to tabulate', async () => {
    harness = await createHarness({
      complete: async () => ({ title: 'Letter', summary: '', tables: [], warnings: [] }),
    });
    const response = await upload(harness, [{ buffer: JPEG_BYTES }]);
    expect(parseEvents(response.body).at(-1)).toMatchObject({
      type: 'error',
      error: { code: 'NO_TABLE_FOUND' },
    });
  });

  it('reports storage failures without exposing internals', async () => {
    harness = await createHarness();
    harness.documents.failWith = new Error('DEADLINE_EXCEEDED firestore.googleapis.com');
    const response = await upload(harness, [{ buffer: JPEG_BYTES }]);
    const last = parseEvents(response.body).at(-1);
    expect(last).toMatchObject({ type: 'error', error: { code: 'INTERNAL' } });
    expect(response.body).not.toContain('firestore');
  });

  it('warns when a long PDF was only partly read', async () => {
    const ocr = new FakeOcr({
      pages: [{ pageNumber: 1, text: loadOcrText('clean-invoice') }],
      totalPages: 40,
    });
    harness = await createHarness({ ocr });
    const response = await upload(harness, [{ buffer: PDF_BYTES }]);
    const ready = parseEvents(response.body).at(-1);
    expect(ready).toMatchObject({
      type: 'ready',
      document: { warnings: ['Only the first 1 of 40 pages were read.'] },
    });
  });

  it('limits conversions per user', async () => {
    harness = await createHarness({ conversionsPerHour: 2 });
    for (let i = 0; i < 2; i += 1) {
      expect((await upload(harness, [{ buffer: JPEG_BYTES }])).statusCode).toBe(200);
    }
    const limited = await upload(harness, [{ buffer: JPEG_BYTES }]);
    expect(limited.statusCode).toBe(429);
    expect(limited.json().error.code).toBe('RATE_LIMITED');
    // Another user is unaffected.
    expect((await upload(harness, [{ buffer: JPEG_BYTES }], 'bob')).statusCode).toBe(200);
  });
});

describe('ConversionLimiter', () => {
  it('frees capacity as the window slides', () => {
    let now = 0;
    const limiter = new ConversionLimiter(2, 1000, () => now);
    expect(limiter.tryConsume('u')).toBe(true);
    now = 500;
    expect(limiter.tryConsume('u')).toBe(true);
    expect(limiter.tryConsume('u')).toBe(false);
    now = 1001;
    expect(limiter.tryConsume('u')).toBe(true);
  });
});
