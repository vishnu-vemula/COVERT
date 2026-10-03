import { ERROR_COPY, isAcceptedMimeType, LIMITS, type AcceptedMimeType } from '@covert/shared';

/** Thrown for files COVERT can't accept; `message` is ready to show. */
export class FileRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileRejectedError';
  }
}

const EXTENSIONS: Record<string, AcceptedMimeType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

/**
 * Resolves a picked file's type from its reported MIME type, falling back to
 * the extension. The API checks the real content again on upload.
 */
export function resolveMimeType(reported: string | null | undefined, name: string): AcceptedMimeType {
  const normalized = (reported ?? '').toLowerCase().split(';')[0]?.trim() ?? '';
  const type = normalized === 'image/jpg' ? 'image/jpeg' : normalized;
  if (isAcceptedMimeType(type)) return type;
  const extension = name.toLowerCase().split('.').pop() ?? '';
  const byExtension = EXTENSIONS[extension];
  if (byExtension && (!type || type === 'application/octet-stream')) return byExtension;
  throw new FileRejectedError(ERROR_COPY.UNSUPPORTED_FILE.message);
}

export function assertSize(bytes: number | null | undefined): void {
  if (bytes != null && bytes > LIMITS.maxFileBytes) {
    throw new FileRejectedError(ERROR_COPY.FILE_TOO_LARGE.message);
  }
  if (bytes === 0) throw new FileRejectedError(ERROR_COPY.CORRUPT_FILE.message);
}
