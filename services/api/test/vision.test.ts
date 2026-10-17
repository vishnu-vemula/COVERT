import type { ImageAnnotatorClient } from '@google-cloud/vision';
import { LIMITS } from '@covert/shared';
import { describe, expect, it, vi } from 'vitest';

import { GoogleVisionOcr } from '../src/ocr/google-vision';
import { JPEG_BYTES, PDF_BYTES } from './support/fixtures';

describe('Google Vision page coverage', () => {
  it('reads each supported PDF page once in batches of five', async () => {
    const batches: number[][] = [];
    const client = {
      batchAnnotateFiles: async ({ requests }: { requests: { pages?: number[] }[] }) => {
        const pages = requests[0]?.pages ?? [1, 2, 3, 4, 5];
        batches.push(pages);
        return [
          {
            responses: [
              {
                totalPages: 17,
                responses: pages.map((pageNumber) => ({
                  context: { pageNumber },
                  fullTextAnnotation: { text: `Page ${pageNumber}` },
                })),
              },
            ],
          },
        ];
      },
    } as unknown as ImageAnnotatorClient;
    const result = await new GoogleVisionOcr(client).recognize({ kind: 'pdf', pdf: PDF_BYTES });
    expect(result.totalPages).toBe(17);
    expect(result.pages.map((page) => page.pageNumber)).toEqual(
      Array.from({ length: LIMITS.maxPdfPages }, (_, index) => index + 1),
    );
    expect(batches).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
    ]);
  });

  it('rejects an incomplete provider batch instead of silently skipping a PDF page', async () => {
    const client = {
      batchAnnotateFiles: async () => [
        {
          responses: [
            {
              totalPages: 3,
              responses: [
                { context: { pageNumber: 1 }, fullTextAnnotation: { text: 'First page' } },
              ],
            },
          ],
        },
      ],
    } as unknown as ImageAnnotatorClient;
    await expect(
      new GoogleVisionOcr(client).recognize({ kind: 'pdf', pdf: PDF_BYTES }),
    ).rejects.toMatchObject({ kind: 'failed' });
  });

  it('stops sending later photos to Vision when the conversion is cancelled', async () => {
    const controller = new AbortController();
    const batchAnnotateImages = vi.fn(async () => {
      controller.abort();
      return [{ responses: [{ fullTextAnnotation: { text: 'First image' } }] }];
    });
    const client = { batchAnnotateImages } as unknown as ImageAnnotatorClient;
    await expect(
      new GoogleVisionOcr(client).recognize(
        { kind: 'images', images: [JPEG_BYTES, JPEG_BYTES] },
        controller.signal,
      ),
    ).rejects.toBeDefined();
    expect(batchAnnotateImages).toHaveBeenCalledOnce();
  });
});
