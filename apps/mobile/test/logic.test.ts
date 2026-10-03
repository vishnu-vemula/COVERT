import type { Table } from '@covert/shared';
import { describe, expect, it } from 'vitest';

import { createEventReader } from '@/lib/api/ndjson';
import { FileRejectedError, assertSize, resolveMimeType } from '@/lib/files/validate';
import { groupByMonth, shapeLabel } from '@/lib/format';
import { isNumericLike, layoutColumns } from '@/lib/table-layout';

describe('createEventReader', () => {
  it('returns complete events as they arrive', () => {
    const read = createEventReader();
    expect(read('{"type":"stage","stage":"reading"}\n{"type":"sta')).toEqual([
      { type: 'stage', stage: 'reading' },
    ]);
    expect(read('{"type":"stage","stage":"reading"}\n{"type":"stage","stage":"structuring"}\n')).toEqual([
      { type: 'stage', stage: 'structuring' },
    ]);
  });

  it('reads a final line without a trailing newline', () => {
    const read = createEventReader();
    const body = '{"type":"error","error":{"code":"OCR_FAILED","message":"m","retryable":true}}';
    expect(read(body)).toEqual([]);
    expect(read(body, true)).toHaveLength(1);
  });

  it('skips malformed and unknown events', () => {
    const read = createEventReader();
    expect(read('not json\n{"type":"mystery"}\n{"type":"stage","stage":"checking"}\n')).toEqual([
      { type: 'stage', stage: 'checking' },
    ]);
  });
});

describe('resolveMimeType', () => {
  it('accepts supported types', () => {
    expect(resolveMimeType('image/jpeg', 'a.jpg')).toBe('image/jpeg');
    expect(resolveMimeType('image/jpg', 'a.jpg')).toBe('image/jpeg');
    expect(resolveMimeType('application/pdf', 'a.pdf')).toBe('application/pdf');
  });

  it('falls back to the extension for generic types', () => {
    expect(resolveMimeType('application/octet-stream', 'scan.PDF')).toBe('application/pdf');
    expect(resolveMimeType(null, 'photo.png')).toBe('image/png');
  });

  it('rejects other formats with readable copy', () => {
    expect(() => resolveMimeType('image/heic', 'photo.heic')).toThrow(FileRejectedError);
    expect(() => resolveMimeType('text/plain', 'notes.pdf')).toThrow('Use a JPG, PNG or PDF');
  });
});

describe('assertSize', () => {
  it('rejects files over the limit and empty files', () => {
    expect(() => assertSize(11 * 1024 * 1024)).toThrow('larger than 10 MB');
    expect(() => assertSize(0)).toThrow(FileRejectedError);
    expect(() => assertSize(2048)).not.toThrow();
    expect(() => assertSize(null)).not.toThrow();
  });
});

describe('table layout', () => {
  const table: Table = {
    id: 't1',
    title: 'Ledger',
    columns: [
      { id: 'a', label: 'Narration' },
      { id: 'b', label: 'Debit' },
    ],
    rows: [
      {
        id: 'r1',
        cells: [
          { columnId: 'a', value: 'NEFT SALARY ACME TECH', uncertain: false },
          { columnId: 'b', value: '18,000.00', uncertain: false },
        ],
      },
      {
        id: 'r2',
        cells: [
          { columnId: 'a', value: 'ATM', uncertain: false },
          { columnId: 'b', value: '', uncertain: false },
        ],
      },
    ],
  };

  it('detects numeric columns', () => {
    expect(isNumericLike('₹2,737.60')).toBe(true);
    expect(isNumericLike('-10.00')).toBe(true);
    expect(isNumericLike('(45.00)')).toBe(true);
    expect(isNumericLike('1,200 CR')).toBe(true);
    expect(isNumericLike('INV-2024')).toBe(false);
    expect(layoutColumns(table).map((column) => column.numeric)).toEqual([false, true]);
  });

  it('widens columns with the system text size', () => {
    const normal = layoutColumns(table, 1);
    const large = layoutColumns(table, 1.5);
    expect(large[0]!.width).toBeGreaterThan(normal[0]!.width);
    expect(normal[0]!.width).toBeGreaterThanOrEqual(112);
  });
});

describe('format', () => {
  it('describes document shape', () => {
    expect(shapeLabel({ tableCount: 1, rowCount: 12, columnCount: 5, uncertainCount: 0 })).toBe(
      '12 rows · 5 columns',
    );
    expect(shapeLabel({ tableCount: 2, rowCount: 1, columnCount: 1, uncertainCount: 0 })).toBe(
      '1 row · 1 column · 2 tables',
    );
  });

  it('groups by month in order', () => {
    const groups = groupByMonth([
      { createdAt: '2026-10-03T10:00:00Z' },
      { createdAt: '2026-10-01T10:00:00Z' },
      { createdAt: '2026-09-28T10:00:00Z' },
    ]);
    expect(groups.map((group) => group.items.length)).toEqual([2, 1]);
  });
});
