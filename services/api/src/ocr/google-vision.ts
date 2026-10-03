import { ImageAnnotatorClient } from '@google-cloud/vision';

import { LIMITS } from '@covert/shared';

import { layoutText, type TextAnnotation } from './layout';
import { OcrError, type OcrInput, type OcrPage, type OcrProvider, type OcrResult } from './types';

const FEATURES = [{ type: 'DOCUMENT_TEXT_DETECTION' as const }];
const CALL_OPTIONS = { timeout: 60_000 };
/** Synchronous file annotation accepts at most five pages per request. */
const PDF_PAGES_PER_REQUEST = 5;
/** gRPC INVALID_ARGUMENT: Vision uses it for undecodable images and PDFs. */
const INVALID_ARGUMENT = 3;

interface VisionStatus {
  code?: number | null;
}

interface VisionImageResponse {
  error?: VisionStatus | null;
  fullTextAnnotation?: TextAnnotation | null;
  context?: { pageNumber?: number | null } | null;
}

/** Cloud Vision `DOCUMENT_TEXT_DETECTION` for photos and the synchronous file API for PDFs. */
export class GoogleVisionOcr implements OcrProvider {
  constructor(private readonly client: ImageAnnotatorClient = new ImageAnnotatorClient()) {}

  async recognize(input: OcrInput): Promise<OcrResult> {
    try {
      return input.kind === 'pdf' ? await this.readPdf(input.pdf) : await this.readImages(input.images);
    } catch (error) {
      if (error instanceof OcrError) throw error;
      throw new OcrError(statusCode(error) === INVALID_ARGUMENT ? 'corrupt' : 'failed', {
        cause: error,
      });
    }
  }

  private async readImages(images: Buffer[]): Promise<OcrResult> {
    const pages: OcrPage[] = [];
    // Sequential keeps memory flat and stays well inside per-user quotas.
    for (const [index, content] of images.entries()) {
      const [batch] = await this.client.batchAnnotateImages(
        { requests: [{ image: { content }, features: FEATURES }] },
        CALL_OPTIONS,
      );
      const response = batch.responses?.[0];
      if (!response) throw new OcrError('failed');
      pages.push({ pageNumber: index + 1, text: readResponse(response) });
    }
    return { pages, totalPages: images.length };
  }

  private async readPdf(pdf: Buffer): Promise<OcrResult> {
    const first = await this.annotatePdf(pdf, []);
    const totalPages = first.totalPages;
    const pages = [...first.pages];
    const lastPage = Math.min(totalPages, LIMITS.maxPdfPages);

    for (let start = PDF_PAGES_PER_REQUEST + 1; start <= lastPage; start += PDF_PAGES_PER_REQUEST) {
      const numbers = range(start, Math.min(start + PDF_PAGES_PER_REQUEST - 1, lastPage));
      const next = await this.annotatePdf(pdf, numbers);
      pages.push(...next.pages);
    }
    return { pages: pages.sort((a, b) => a.pageNumber - b.pageNumber), totalPages };
  }

  /** An empty `pages` list asks Vision for the first five pages. */
  private async annotatePdf(pdf: Buffer, pages: number[]): Promise<OcrResult> {
    const [batch] = await this.client.batchAnnotateFiles(
      {
        requests: [
          {
            inputConfig: { content: pdf, mimeType: 'application/pdf' },
            features: FEATURES,
            ...(pages.length > 0 ? { pages } : {}),
          },
        ],
      },
      CALL_OPTIONS,
    );
    const file = batch.responses?.[0];
    if (!file) throw new OcrError('failed');
    if (file.error?.code) throw new OcrError(file.error.code === INVALID_ARGUMENT ? 'corrupt' : 'failed');

    const responses = file.responses ?? [];
    return {
      totalPages: file.totalPages ?? responses.length,
      pages: responses.map((response, index) => ({
        pageNumber: response.context?.pageNumber ?? (pages[index] ?? index + 1),
        text: readResponse(response),
      })),
    };
  }
}

function readResponse(response: VisionImageResponse): string {
  if (response.error?.code) {
    throw new OcrError(response.error.code === INVALID_ARGUMENT ? 'corrupt' : 'failed');
  }
  return layoutText(response.fullTextAnnotation);
}

function statusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'number') {
    return error.code;
  }
  return undefined;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
