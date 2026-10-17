import type { FastifyBaseLogger } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { AppError, logFailure } from '../src/errors';

describe('failure logging', () => {
  it('keeps provider messages out of logs because they may contain document content', () => {
    const error = vi.fn();
    const log = { error } as unknown as FastifyBaseLogger;
    const cause = Object.assign(new Error('Invoice for private customer, account 12345'), {
      code: 'UNAVAILABLE',
      status: 503,
    });
    logFailure(log, new AppError('OCR_FAILED', { cause }));
    expect(JSON.stringify(error.mock.calls)).not.toContain('private customer');
    expect(error.mock.calls[0]?.[0]).toMatchObject({
      code: 'OCR_FAILED',
      cause: { name: 'Error', code: 'UNAVAILABLE', status: 503 },
    });
  });
});
