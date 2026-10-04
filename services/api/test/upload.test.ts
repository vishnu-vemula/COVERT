import { LIMITS } from '@covert/shared';
import { describe, expect, it } from 'vitest';

import { looksIntact, sniffMimeType, validateUpload } from '../src/upload/file-type';
import { JPEG_BYTES, PDF_BYTES, PNG_BYTES } from './support/fixtures';

describe('sniffMimeType', () => {
  it('detects formats from content, not names', () => {
    expect(sniffMimeType(JPEG_BYTES)).toBe('image/jpeg');
    expect(sniffMimeType(PNG_BYTES)).toBe('image/png');
    expect(sniffMimeType(PDF_BYTES)).toBe('application/pdf');
  });

  it('accepts a PDF header after leading junk bytes', () => {
    expect(sniffMimeType(Buffer.concat([Buffer.from('\n\n  '), PDF_BYTES]))).toBe(
      'application/pdf',
    );
  });

  it('rejects other formats', () => {
    expect(sniffMimeType(Buffer.from('GIF89a......'))).toBeNull();
    expect(sniffMimeType(Buffer.from('<html><body>hi</body></html>'))).toBeNull();
    expect(
      sniffMimeType(Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    ).toBeNull();
    expect(sniffMimeType(Buffer.alloc(0))).toBeNull();
  });
});

describe('looksIntact', () => {
  it('accepts complete files', () => {
    expect(looksIntact(JPEG_BYTES, 'image/jpeg')).toBe(true);
    expect(looksIntact(PNG_BYTES, 'image/png')).toBe(true);
    expect(looksIntact(PDF_BYTES, 'application/pdf')).toBe(true);
  });

  it('rejects truncated files', () => {
    expect(looksIntact(JPEG_BYTES.subarray(0, JPEG_BYTES.length - 2), 'image/jpeg')).toBe(false);
    expect(looksIntact(PNG_BYTES.subarray(0, 40), 'image/png')).toBe(false);
    expect(looksIntact(PDF_BYTES.subarray(0, 30), 'application/pdf')).toBe(false);
  });

  it('rejects a JPEG header with no image frame', () => {
    const headerOnly = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd9]);
    expect(looksIntact(headerOnly, 'image/jpeg')).toBe(false);
  });
});

describe('validateUpload', () => {
  it('accepts one or more photographed pages', () => {
    expect(validateUpload([JPEG_BYTES, PNG_BYTES])).toMatchObject({
      kind: 'images',
      mimeType: 'image/jpeg',
    });
    expect(validateUpload([PNG_BYTES])).toMatchObject({ kind: 'images', mimeType: 'image/png' });
  });

  it('accepts a single PDF', () => {
    expect(validateUpload([PDF_BYTES])).toMatchObject({ kind: 'pdf', mimeType: 'application/pdf' });
  });

  it.each([
    ['nothing uploaded', [], 'INVALID_REQUEST'],
    ['an empty file', [Buffer.alloc(0)], 'CORRUPT_FILE'],
    ['an unsupported file', [Buffer.from('GIF89a, not supported')], 'UNSUPPORTED_FILE'],
    ['a damaged PDF', [PDF_BYTES.subarray(0, 20)], 'CORRUPT_FILE'],
    ['a PDF with photos', [PDF_BYTES, JPEG_BYTES], 'TOO_MANY_FILES'],
    [
      'too many pages',
      Array.from({ length: LIMITS.maxImagePages + 1 }, () => JPEG_BYTES),
      'TOO_MANY_FILES',
    ],
    [
      'an oversized file',
      [Buffer.concat([JPEG_BYTES, Buffer.alloc(LIMITS.maxFileBytes)])],
      'FILE_TOO_LARGE',
    ],
  ] as const)('rejects %s', (_label, files, code) => {
    expect(() => validateUpload([...files])).toThrow(expect.objectContaining({ code }));
  });
});
