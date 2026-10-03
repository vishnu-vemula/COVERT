import { LIMITS, type AcceptedMimeType } from '@covert/shared';

import { AppError } from '../errors';

export type ValidatedUpload =
  | { kind: 'images'; mimeType: 'image/jpeg' | 'image/png'; images: Buffer[] }
  | { kind: 'pdf'; mimeType: 'application/pdf'; pdf: Buffer };

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);

/**
 * Detects the real file type from its content. File names and client-declared
 * MIME types are never trusted.
 */
export function sniffMimeType(buffer: Buffer): AcceptedMimeType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  // The PDF header may be preceded by junk bytes; readers accept it within the first 1024.
  if (buffer.subarray(0, 1024).toString('latin1').includes('%PDF-')) return 'application/pdf';
  return null;
}

/** Cheap structural checks that catch truncated or damaged files before OCR. */
export function looksIntact(buffer: Buffer, type: AcceptedMimeType): boolean {
  switch (type) {
    case 'image/jpeg':
      // Needs a frame header and an end-of-image marker.
      return hasJpegFrame(buffer) && buffer.lastIndexOf(JPEG_EOI) > 2;
    case 'image/png':
      return (
        buffer.length > 45 &&
        buffer.subarray(12, 16).toString('latin1') === 'IHDR' &&
        buffer.subarray(-32).toString('latin1').includes('IEND')
      );
    case 'application/pdf':
      return buffer.subarray(-2048).toString('latin1').includes('%%EOF');
  }
}

function hasJpegFrame(buffer: Buffer): boolean {
  for (let i = 2; i < buffer.length - 1; i += 1) {
    if (buffer[i] === 0xff) {
      const marker = buffer[i + 1] ?? 0;
      // SOF0–SOF15, excluding DHT (C4), JPG (C8) and DAC (CC).
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return true;
    }
  }
  return false;
}

export function validateUpload(files: Buffer[]): ValidatedUpload {
  if (files.length === 0) throw new AppError('INVALID_REQUEST', { detail: 'No file uploaded' });

  const types = files.map((buffer) => {
    if (buffer.length === 0) throw new AppError('CORRUPT_FILE');
    if (buffer.length > LIMITS.maxFileBytes) throw new AppError('FILE_TOO_LARGE');
    const type = sniffMimeType(buffer);
    if (!type) throw new AppError('UNSUPPORTED_FILE');
    if (!looksIntact(buffer, type)) throw new AppError('CORRUPT_FILE');
    return type;
  });

  const [first] = files;
  if (first && types.includes('application/pdf')) {
    if (files.length > 1) throw new AppError('TOO_MANY_FILES', { detail: 'PDF must be uploaded alone' });
    return { kind: 'pdf', mimeType: 'application/pdf', pdf: first };
  }

  if (files.length > LIMITS.maxImagePages) throw new AppError('TOO_MANY_FILES');
  const mimeType = types.every((type) => type === 'image/png') ? 'image/png' : 'image/jpeg';
  return { kind: 'images', mimeType, images: files };
}
