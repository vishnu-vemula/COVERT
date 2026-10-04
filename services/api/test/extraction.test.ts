import { describe, expect, it } from 'vitest';
import { zodTextFormat } from 'openai/helpers/zod';

import { createExtractor, ExtractionError } from '../src/extraction/extractor';
import { ExtractionSchema, type Extraction } from '../src/extraction/schema';
import { transformExtraction } from '../src/extraction/transform';
import { FIXTURE_NAMES, loadExtraction, loadRawExtraction } from './support/fixtures';

/** Every non-blank value the model produced, per table. */
function sourceValues(extraction: Extraction): string[][] {
  return extraction.tables.map((table) =>
    table.rows.flatMap((row) => row.cells.map((cell) => cell.value.trim()).filter(Boolean)),
  );
}

describe('structured response validation', () => {
  it.each(FIXTURE_NAMES)('accepts the %s fixture', (name) => {
    expect(ExtractionSchema.safeParse(loadRawExtraction(name)).success).toBe(true);
  });

  it('rejects rows that use dynamic keys instead of explicit cells', () => {
    const raw = loadRawExtraction('simple-list') as { tables: { rows: unknown[] }[] };
    raw.tables[0]!.rows = [{ id: 'r1', item: 'Rice', quantity: '5kg' }];
    expect(ExtractionSchema.safeParse(raw).success).toBe(false);
  });

  it('rejects a missing uncertain flag', () => {
    const raw = structuredClone(loadRawExtraction('simple-list')) as {
      tables: { rows: { cells: Record<string, unknown>[] }[] }[];
    };
    delete raw.tables[0]!.rows[0]!.cells[0]!.uncertain;
    expect(ExtractionSchema.safeParse(raw).success).toBe(false);
  });

  it('rejects non-string values', () => {
    const raw = structuredClone(loadRawExtraction('simple-list')) as {
      tables: { rows: { cells: Record<string, unknown>[] }[] }[];
    };
    raw.tables[0]!.rows[0]!.cells[1]!.value = 5;
    expect(ExtractionSchema.safeParse(raw).success).toBe(false);
  });

  it('produces a strict JSON schema for Structured Outputs', () => {
    const { schema } = zodTextFormat(ExtractionSchema, 'document_result') as unknown as {
      schema: Record<string, unknown>;
    };
    const objects: Record<string, unknown>[] = [];
    const visit = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const record = node as Record<string, unknown>;
      if (record.type === 'object') objects.push(record);
      Object.values(record).forEach(visit);
    };
    visit(schema);
    expect(objects.length).toBeGreaterThanOrEqual(5);
    for (const object of objects) {
      expect(object.additionalProperties).toBe(false);
      expect(new Set(object.required as string[])).toEqual(
        new Set(Object.keys(object.properties as object)),
      );
    }
  });
});

describe('transformExtraction', () => {
  it.each(FIXTURE_NAMES)('keeps every record and value from %s', (name) => {
    const extraction = loadExtraction(name);
    const result = transformExtraction(extraction);

    const expectedRows = extraction.tables.map(
      (table) => table.rows.filter((row) => row.cells.some((cell) => cell.value.trim())).length,
    );
    expect(result.tables.map((table) => table.rows.length)).toEqual(expectedRows);

    sourceValues(extraction).forEach((values, index) => {
      const output = result.tables[index]!.rows.flatMap((row) =>
        row.cells.map((cell) => cell.value),
      );
      for (const value of values) {
        expect(output.some((cell) => cell === value || cell.split(' · ').includes(value))).toBe(
          true,
        );
      }
    });
  });

  it.each(FIXTURE_NAMES)('gives every row of %s one cell per column, in column order', (name) => {
    for (const table of transformExtraction(loadExtraction(name)).tables) {
      const columnIds = table.columns.map((column) => column.id);
      expect(new Set(columnIds).size).toBe(columnIds.length);
      for (const row of table.rows) {
        expect(row.cells.map((cell) => cell.columnId)).toEqual(columnIds);
      }
      expect(new Set(table.rows.map((row) => row.id)).size).toBe(table.rows.length);
    }
  });

  it('preserves numbers, currencies and identifiers exactly', () => {
    const [details, items, totals] = transformExtraction(loadExtraction('clean-invoice')).tables;
    expect(details!.rows[0]!.cells[1]!.value).toBe('INV-2024-0193');
    expect(items!.rows[0]!.cells.map((cell) => cell.value)).toEqual([
      '1',
      'A4 Sketch Pad (120 gsm)',
      '4',
      '₹180.00',
      '₹720.00',
    ]);
    expect(totals!.rows[2]!.cells[1]!.value).toBe('₹2,737.60');
  });

  it('keeps missing values empty', () => {
    const [schedule] = transformExtraction(loadExtraction('missing-values')).tables;
    const wednesday = schedule!.rows[3]!;
    expect(wednesday.cells.map((cell) => cell.value)).toEqual([
      'Wednesday',
      '',
      'Library',
      '—',
      '',
    ]);
  });

  it('keeps uncertainty and the raw OCR source for corrected values', () => {
    const [items] = transformExtraction(loadExtraction('messy-receipt')).tables;
    expect(items!.rows[1]!.cells[1]).toEqual({
      columnId: 'c2',
      value: '35.00',
      uncertain: true,
      sourceText: '3S.00',
    });
    // Identical source text is not stored twice.
    expect(items!.rows[3]!.cells[1]!.sourceText).toBeUndefined();
  });

  it('handles irregular rows without losing values', () => {
    const result = transformExtraction(loadExtraction('irregular-columns'));
    const [inventory] = result.tables;
    expect(inventory!.columns.map((column) => column.label)).toEqual([
      'SKU',
      'Item',
      'Bin',
      'Qty',
      'Notes',
      'Other',
    ]);
    // The blank model row is dropped; the six real records remain.
    expect(inventory!.rows).toHaveLength(6);
    // A row missing a cell gets an empty one.
    expect(inventory!.rows[2]!.cells[3]).toEqual({ columnId: 'c4', value: '', uncertain: false });
    // A cell pointing at an unknown column lands in "Other" and is flagged.
    expect(inventory!.rows[5]!.cells[5]).toEqual({
      columnId: 'c6',
      value: 'checked 02/10',
      uncertain: true,
    });
    expect(result.warnings.some((warning) => warning.includes('Other'))).toBe(true);
  });

  it('derives columns from cells when the model omitted them', () => {
    const extraction = loadExtraction('simple-list');
    extraction.tables[0]!.columns = [];
    const [table] = transformExtraction(extraction).tables;
    expect(table!.columns).toEqual([
      { id: 'c1', label: 'Item' },
      { id: 'c2', label: 'Quantity' },
    ]);
    expect(table!.rows).toHaveLength(6);
  });

  it('drops tables with no data and falls back to safe titles', () => {
    const result = transformExtraction({
      title: '  ',
      summary: '',
      warnings: ['  ', 'Check page 2.', 'Check page 2.'],
      tables: [
        { id: 'x', title: '', columns: [{ id: 'a', label: '' }], rows: [] },
        {
          id: 'y',
          title: '',
          columns: [{ id: 'a', label: '' }],
          rows: [
            {
              id: 'r',
              cells: [{ columnId: 'a', value: '42', uncertain: false, sourceText: null }],
            },
          ],
        },
      ],
    });
    expect(result.title).toBe('Untitled document');
    expect(result.summary).toBe('1 record extracted.');
    expect(result.warnings).toEqual(['Check page 2.']);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0]!.title).toBe('Table 1');
    expect(result.tables[0]!.columns[0]!.label).toBe('Column 1');
  });
});

describe('createExtractor', () => {
  const valid = loadRawExtraction('simple-list');

  it('returns validated output on the first attempt', async () => {
    let calls = 0;
    const extractor = createExtractor(async () => {
      calls += 1;
      return valid;
    });
    await expect(extractor.extract('text')).resolves.toMatchObject({
      title: 'Grocery list — week 41',
    });
    expect(calls).toBe(1);
  });

  it('retries once with the same source when output is invalid', async () => {
    const seen: string[] = [];
    const outputs: unknown[] = [{ title: 'broken' }, valid];
    const extractor = createExtractor(async (text) => {
      seen.push(text);
      return outputs.shift();
    });
    await expect(extractor.extract('same source')).resolves.toBeTruthy();
    expect(seen).toEqual(['same source', 'same source']);
  });

  it('gives up after a second invalid output', async () => {
    let calls = 0;
    const extractor = createExtractor(async () => {
      calls += 1;
      return null;
    });
    await expect(extractor.extract('text')).rejects.toMatchObject({ kind: 'invalid' });
    expect(calls).toBe(2);
  });

  it('does not retry provider failures', async () => {
    let calls = 0;
    const extractor = createExtractor(async () => {
      calls += 1;
      throw new ExtractionError('provider');
    });
    await expect(extractor.extract('text')).rejects.toMatchObject({ kind: 'provider' });
    expect(calls).toBe(1);
  });
});
