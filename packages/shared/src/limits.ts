export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const LIMITS = {
  /** Per uploaded file. Phones resize photos well below this before upload. */
  maxFileBytes: 10 * 1024 * 1024,
  /** Photographed pages that can be combined into one document. */
  maxImagePages: 6,
  /** PDF pages that are read; later pages are skipped with a warning. */
  maxPdfPages: 15,
  maxTitleLength: 120,
  maxCellLength: 2000,
} as const;

export function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}
