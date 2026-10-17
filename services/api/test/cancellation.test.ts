import { describe, expect, it, vi } from 'vitest';

import { createExtractor } from '../src/extraction/extractor';
import { processDocument } from '../src/pipeline/process-document';
import { validateUpload } from '../src/upload/file-type';
import { JPEG_BYTES, loadExtraction, loadOcrText } from './support/fixtures';
import { FakeOcr, ocrOf } from './support/harness';
import { MemoryDocuments } from './support/memory-documents';

describe('conversion cancellation', () => {
  it.each(['before-start', 'reading', 'structuring', 'checking'])(
    'never saves or starts later providers after cancellation at %s',
    async (stage) => {
      const controller = new AbortController();
      const ocr = new FakeOcr(ocrOf(loadOcrText('clean-invoice')));
      const extract = vi.fn(async () => loadExtraction('clean-invoice'));
      const documents = new MemoryDocuments();
      if (stage === 'before-start') controller.abort();
      await expect(
        processDocument(
          'alice',
          validateUpload([JPEG_BYTES]),
          {
            ocr,
            extractor: { extract },
            documents,
          },
          (current) => {
            if (current === stage) controller.abort();
          },
          controller.signal,
        ),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      expect(documents.records.size).toBe(0);
      expect(ocr.calls).toBe(['before-start', 'reading'].includes(stage) ? 0 : 1);
      expect(extract).toHaveBeenCalledTimes(stage === 'checking' ? 1 : 0);
    },
  );

  it('does not retry invalid model output after cancellation', async () => {
    const controller = new AbortController();
    const complete = vi.fn(async () => {
      controller.abort();
      return null;
    });
    await expect(
      createExtractor(complete).extract('text', controller.signal),
    ).rejects.toBeDefined();
    expect(complete).toHaveBeenCalledOnce();
  });
});
