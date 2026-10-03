import { ExtractionSchema, type Extraction } from './schema';

export class ExtractionError extends Error {
  constructor(
    readonly kind: 'provider' | 'invalid',
    options?: { cause?: unknown },
  ) {
    super(`Extraction ${kind}`, options);
    this.name = 'ExtractionError';
  }
}

/**
 * One structured-output request. Returns the parsed model output (not yet
 * trusted), `null` when the model produced nothing usable (refusal, truncated
 * output, unparsable JSON), and throws `ExtractionError('provider')` when the
 * provider itself failed.
 */
export type StructuredCompletion = (ocrText: string, signal?: AbortSignal) => Promise<unknown>;

export interface Extractor {
  extract(ocrText: string, signal?: AbortSignal): Promise<Extraction>;
}

/** Validates model output and retries once, with the same source, if it is invalid. */
export function createExtractor(complete: StructuredCompletion): Extractor {
  return {
    async extract(ocrText, signal) {
      let lastIssue: unknown;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const output = await complete(ocrText, signal);
        const parsed = ExtractionSchema.safeParse(output);
        if (parsed.success) return parsed.data;
        lastIssue = output === null ? 'empty output' : parsed.error;
      }
      throw new ExtractionError('invalid', { cause: lastIssue });
    },
  };
}
