/**
 * Provider-neutral OCR contract. Controllers and the structuring pipeline only
 * see `OcrResult`, so the OCR provider can be replaced without touching them.
 */

export type OcrInput = { kind: 'images'; images: Buffer[] } | { kind: 'pdf'; pdf: Buffer };

export interface OcrPage {
  pageNumber: number;
  /** Layout-preserving text: one line per visual line, wide gaps kept as runs of spaces. */
  text: string;
}

export interface OcrResult {
  pages: OcrPage[];
  /** Pages in the source file; may exceed `pages.length` when a long PDF was cut short. */
  totalPages: number;
}

export interface OcrProvider {
  recognize(input: OcrInput): Promise<OcrResult>;
}

export class OcrError extends Error {
  constructor(
    readonly kind: 'corrupt' | 'failed',
    options?: { cause?: unknown },
  ) {
    super(`OCR ${kind}`, options);
    this.name = 'OcrError';
  }
}
