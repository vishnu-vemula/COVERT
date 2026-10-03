import { apiError, type ApiError, type ErrorCode } from '@covert/shared';
import type { FastifyBaseLogger } from 'fastify';

const STATUS: Partial<Record<ErrorCode, number>> = {
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  INVALID_REQUEST: 400,
  UNSUPPORTED_FILE: 415,
  FILE_TOO_LARGE: 413,
  TOO_MANY_FILES: 400,
  CORRUPT_FILE: 422,
  NO_TEXT_FOUND: 422,
  NO_TABLE_FOUND: 422,
  DOCUMENT_TOO_LARGE: 422,
  OCR_FAILED: 502,
  EXTRACTION_FAILED: 502,
  STORAGE_FAILED: 503,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
};

/** An error that is safe to describe to the person using COVERT. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, options?: { cause?: unknown; detail?: string }) {
    super(options?.detail ?? code, { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS[code] ?? 500;
  }

  toBody(): { error: ApiError } {
    return { error: apiError(this.code) };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Logs codes and provider error metadata; never request bodies, tokens or document text. */
export function logFailure(log: FastifyBaseLogger, error: AppError): void {
  const cause = error.cause;
  const details = {
    code: error.code,
    detail: error.message !== error.code ? error.message : undefined,
    cause:
      cause instanceof Error
        ? {
            name: cause.name,
            message: cause.message,
            code: 'code' in cause ? cause.code : undefined,
            status: 'status' in cause ? cause.status : undefined,
          }
        : undefined,
  };
  if (error.status >= 500) log.error(details, 'request failed');
  else log.info(details, 'request rejected');
}
