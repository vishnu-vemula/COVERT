import { readFileSync } from 'node:fs';

import { ExtractionSchema, type Extraction } from '../../src/extraction/schema';

export const FIXTURE_NAMES = [
  'clean-invoice',
  'messy-receipt',
  'financial-statement',
  'simple-list',
  'missing-values',
  'irregular-columns',
] as const;

export type FixtureName = (typeof FIXTURE_NAMES)[number];

export function loadOcrText(name: FixtureName): string {
  return readFileSync(new URL(`../fixtures/${name}/ocr.txt`, import.meta.url), 'utf8');
}

/** Raw JSON, as a model would return it (not yet validated). */
export function loadRawExtraction(name: FixtureName): unknown {
  return JSON.parse(
    readFileSync(new URL(`../fixtures/${name}/extraction.json`, import.meta.url), 'utf8'),
  );
}

export function loadExtraction(name: FixtureName): Extraction {
  return ExtractionSchema.parse(loadRawExtraction(name));
}

/** A real 1×1 PNG. */
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

/** Structurally plausible JPEG: SOI, APP0, SOF0, a little data and EOI. */
export const JPEG_BYTES = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  Buffer.from('JFIF\0', 'latin1'),
  Buffer.alloc(9),
  Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x03]),
  Buffer.alloc(64, 0x11),
  Buffer.from([0xff, 0xd9]),
]);

export const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
  'latin1',
);
