import { describe, expect, it } from 'vitest';

import { escapeCsvField, exportFileName, toCsv, toTsv, type Table } from '../src';

function table(rows: string[][], labels = ['Item', 'Note', 'Amount']): Table {
  const columns = labels.map((label, index) => ({ id: `c${index}`, label }));
  return {
    id: 't1',
    title: 'Test',
    columns,
    rows: rows.map((values, rowIndex) => ({
      id: `r${rowIndex}`,
      cells: values.map((value, index) => ({ columnId: `c${index}`, value, uncertain: false })),
    })),
  };
}

describe('escapeCsvField', () => {
  it('leaves simple values untouched', () => {
    expect(escapeCsvField('Electricity')).toBe('Electricity');
    expect(escapeCsvField('')).toBe('');
  });

  it('quotes values containing commas', () => {
    expect(escapeCsvField('1,200.00')).toBe('"1,200.00"');
  });

  it('doubles embedded quotes', () => {
    expect(escapeCsvField('12" pipe')).toBe('"12"" pipe"');
  });

  it('quotes values containing line breaks', () => {
    expect(escapeCsvField('Line one\nLine two')).toBe('"Line one\nLine two"');
    expect(escapeCsvField('a\r\nb')).toBe('"a\r\nb"');
  });

  it('neutralizes spreadsheet formulas but keeps signed numbers', () => {
    expect(escapeCsvField('=SUM(A1:A3)')).toBe("'=SUM(A1:A3)");
    expect(escapeCsvField('@cmd')).toBe("'@cmd");
    expect(escapeCsvField('-42.50')).toBe('-42.50');
    expect(escapeCsvField('+1 000')).toBe('+1 000');
    expect(escapeCsvField('-12%')).toBe('-12%');
  });
});

describe('toCsv', () => {
  it('writes a header row and CRLF-separated records', () => {
    const csv = toCsv(table([['Tea', 'Green, loose', '₹120']]));
    expect(csv).toBe('Item,Note,Amount\r\nTea,"Green, loose",₹120');
  });

  it('keeps cells aligned to columns even when cells are stored out of order', () => {
    const base = table([['A', 'B', 'C']]);
    const row = base.rows[0]!;
    row.cells.reverse();
    expect(toCsv(base).split('\r\n')[1]).toBe('A,B,C');
  });

  it('writes empty fields for missing cells instead of dropping them', () => {
    const base = table([['A', 'B', 'C']]);
    base.rows[0]!.cells.splice(1, 1);
    expect(toCsv(base).split('\r\n')[1]).toBe('A,,C');
  });

  it('exports edited values', () => {
    const base = table([['A', 'B', 'C']]);
    base.rows[0]!.cells[2] = { columnId: 'c2', value: 'Edited', uncertain: false, edited: true };
    expect(toCsv(base)).toContain('A,B,Edited');
  });

  it('preserves every record', () => {
    const rows = Array.from({ length: 250 }, (_, i) => [`Item ${i}`, '', `${i}`]);
    expect(toCsv(table(rows)).split('\r\n')).toHaveLength(251);
  });
});

describe('toTsv', () => {
  it('flattens tabs and line breaks inside values', () => {
    expect(toTsv(table([['A\tB', 'one\ntwo', '3']]))).toBe('Item\tNote\tAmount\nA B\tone two\t3');
  });
});

describe('exportFileName', () => {
  it('creates a safe file name', () => {
    expect(exportFileName('Electricity Bill — Sep/Oct', 'csv')).toBe('electricity-bill-sepoct.csv');
    expect(exportFileName('***', 'csv')).toBe('covert-table.csv');
  });
});
