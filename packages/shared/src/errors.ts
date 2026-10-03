import { z } from 'zod';

import { LIMITS } from './limits';

export const ERROR_CODES = [
  // Raised by the API
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'INVALID_REQUEST',
  'UNSUPPORTED_FILE',
  'FILE_TOO_LARGE',
  'TOO_MANY_FILES',
  'CORRUPT_FILE',
  'NO_TEXT_FOUND',
  'NO_TABLE_FOUND',
  'OCR_FAILED',
  'EXTRACTION_FAILED',
  'DOCUMENT_TOO_LARGE',
  'STORAGE_FAILED',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL',
  // Raised by clients
  'NETWORK_ERROR',
  'TIMEOUT',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ApiErrorSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
  retryable: z.boolean(),
});

export const ApiErrorResponseSchema = z.object({ error: ApiErrorSchema });

export type ApiError = z.infer<typeof ApiErrorSchema>;

const maxMb = LIMITS.maxFileBytes / (1024 * 1024);

/** Human-readable copy for every error a person can encounter. */
export const ERROR_COPY: Record<ErrorCode, { message: string; retryable: boolean }> = {
  UNAUTHENTICATED: { message: 'Sign in to continue.', retryable: false },
  SESSION_EXPIRED: { message: 'Your session has expired. Sign in again.', retryable: false },
  INVALID_REQUEST: { message: 'That request couldn’t be completed. Try again.', retryable: true },
  UNSUPPORTED_FILE: {
    message: 'This file type isn’t supported. Use a JPG, PNG or PDF.',
    retryable: false,
  },
  FILE_TOO_LARGE: {
    message: `This file is larger than ${maxMb} MB. Try a smaller file or a lower-resolution photo.`,
    retryable: false,
  },
  TOO_MANY_FILES: {
    message: `A document can have up to ${LIMITS.maxImagePages} photographed pages.`,
    retryable: false,
  },
  CORRUPT_FILE: {
    message: 'This file appears to be damaged and couldn’t be opened.',
    retryable: false,
  },
  NO_TEXT_FOUND: {
    message: 'No readable text was found. Try a sharper photo with even lighting.',
    retryable: false,
  },
  NO_TABLE_FOUND: {
    message: 'The document was read, but there was nothing to organize into a table.',
    retryable: false,
  },
  OCR_FAILED: {
    message: 'The document couldn’t be read right now. Try again in a moment.',
    retryable: true,
  },
  EXTRACTION_FAILED: {
    message: 'The text was read, but organizing it into a table failed. Try again.',
    retryable: true,
  },
  DOCUMENT_TOO_LARGE: {
    message: 'This document produced more data than can be saved. Try fewer pages.',
    retryable: false,
  },
  STORAGE_FAILED: {
    message: 'Your changes couldn’t be saved. Try again.',
    retryable: true,
  },
  NOT_FOUND: { message: 'This document no longer exists.', retryable: false },
  RATE_LIMITED: {
    message: 'You’ve made a lot of requests in a short time. Wait a few minutes and try again.',
    retryable: true,
  },
  INTERNAL: { message: 'Something went wrong on our side. Try again.', retryable: true },
  NETWORK_ERROR: {
    message: 'Couldn’t reach COVERT. Check your connection and try again.',
    retryable: true,
  },
  TIMEOUT: {
    message: 'This is taking longer than expected. Check your connection and try again.',
    retryable: true,
  },
};

export function apiError(code: ErrorCode, message?: string): ApiError {
  const copy = ERROR_COPY[code];
  return { code, message: message ?? copy.message, retryable: copy.retryable };
}
