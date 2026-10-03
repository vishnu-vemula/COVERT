import type { ProcessEvent } from '@covert/shared';
import type { FastifyInstance } from 'fastify';

import { buildApp, type AppDeps } from '../../src/app';
import { TokenError, type TokenVerifier } from '../../src/auth/token-verifier';
import { createExtractor, type StructuredCompletion } from '../../src/extraction/extractor';
import type { OcrProvider, OcrResult } from '../../src/ocr/types';
import { loadOcrText, loadRawExtraction } from './fixtures';
import { MemoryDocuments } from './memory-documents';

/** Tokens understood by the fake verifier: "valid:<uid>", "expired", anything else is invalid. */
export const fakeVerifier: TokenVerifier = async (token) => {
  if (token.startsWith('valid:')) return { uid: token.slice('valid:'.length) };
  throw new TokenError(token === 'expired' ? 'expired' : 'invalid');
};

export function auth(uid: string): { authorization: string } {
  return { authorization: `Bearer valid:${uid}` };
}

export class FakeOcr implements OcrProvider {
  calls = 0;
  constructor(public result: OcrResult | Error) {}
  async recognize(): Promise<OcrResult> {
    this.calls += 1;
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

export function ocrOf(text: string, totalPages = 1): OcrResult {
  return { pages: [{ pageNumber: 1, text }], totalPages };
}

export interface Harness {
  app: FastifyInstance;
  documents: MemoryDocuments;
  ocr: FakeOcr;
  completions: { count: number };
}

export async function createHarness(
  overrides: {
    ocr?: FakeOcr;
    complete?: StructuredCompletion;
    conversionsPerHour?: number;
  } = {},
): Promise<Harness> {
  const documents = new MemoryDocuments();
  const ocr = overrides.ocr ?? new FakeOcr(ocrOf(loadOcrText('clean-invoice')));
  const completions = { count: 0 };
  const complete: StructuredCompletion = async (text, signal) => {
    completions.count += 1;
    if (overrides.complete) return overrides.complete(text, signal);
    return loadRawExtraction('clean-invoice');
  };
  const deps: AppDeps = {
    verifyToken: fakeVerifier,
    ocr,
    extractor: createExtractor(complete),
    documents,
  };
  const app = await buildApp(deps, { conversionsPerHour: overrides.conversionsPerHour ?? 30 });
  return { app, documents, ocr, completions };
}

/** Builds a multipart/form-data body by hand so tests control every byte. */
export function multipart(
  files: { buffer: Buffer; filename?: string; contentType?: string; field?: string }[],
): { payload: Buffer; headers: Record<string, string> } {
  const boundary = '----covert-test-boundary';
  const parts = files.map((file, index) =>
    Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${file.field ?? 'file'}"; filename="${file.filename ?? `page-${index + 1}`}"\r\n` +
          `Content-Type: ${file.contentType ?? 'application/octet-stream'}\r\n\r\n`,
      ),
      file.buffer,
      Buffer.from('\r\n'),
    ]),
  );
  return {
    payload: Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

export function parseEvents(body: string): ProcessEvent[] {
  return body
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as ProcessEvent);
}
