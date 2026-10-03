import { describe, expect, it } from 'vitest';

import {
  computeStats,
  DocumentSchema,
  ProcessEventSchema,
  updateCellValue,
  type Table,
} from '../src';

const tables: Table[] = [
  {
    id: 't1',
    title: 'Readings',
    columns: [
      { id: 'date', label: 'Date' },
      { id: 'units', label: 'Units' },
    ],
    rows: [
      {
        id: 'r1',
        cells: [
          { columnId: 'date', value: '04 Sep', uncertain: false },
          { columnId: 'units', value: '41', uncertain: true, sourceText: '4l' },
        ],
      },
    ],
  },
  {
    id: 't2',
    title: 'Charges',
    columns: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ],
    rows: [],
  },
];

describe('computeStats', () => {
  it('counts tables, rows, widest table and uncertain cells', () => {
    expect(computeStats(tables)).toEqual({
      tableCount: 2,
      rowCount: 1,
      columnCount: 3,
      uncertainCount: 1,
    });
  });
});

describe('updateCellValue', () => {
  it('replaces one value, clears uncertainty and marks it edited', () => {
    const next = updateCellValue(tables, { tableId: 't1', rowId: 'r1', columnId: 'units' }, '47');
    expect(next?.[0]?.rows[0]?.cells[1]).toEqual({
      columnId: 'units',
      value: '47',
      uncertain: false,
      sourceText: '4l',
      edited: true,
    });
    expect(tables[0]?.rows[0]?.cells[1]?.value).toBe('41');
  });

  it('returns null for unknown cells', () => {
    expect(updateCellValue(tables, { tableId: 't1', rowId: 'nope', columnId: 'units' }, 'x')).toBe(
      null,
    );
  });
});

describe('schemas', () => {
  it('accepts a complete document', () => {
    const parsed = DocumentSchema.safeParse({
      id: 'doc1',
      title: 'Bill',
      fileType: 'image/jpeg',
      pageCount: 1,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
      stats: computeStats(tables),
      summary: 'One reading.',
      warnings: [],
      tables,
      ocrText: '04 Sep 41',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects tables without columns', () => {
    const parsed = DocumentSchema.shape.tables.safeParse([{ ...tables[0], columns: [] }]);
    expect(parsed.success).toBe(false);
  });

  it('parses processing events', () => {
    expect(ProcessEventSchema.parse({ type: 'stage', stage: 'reading' })).toEqual({
      type: 'stage',
      stage: 'reading',
    });
    expect(ProcessEventSchema.safeParse({ type: 'stage', stage: 'uploading' }).success).toBe(false);
  });
});
