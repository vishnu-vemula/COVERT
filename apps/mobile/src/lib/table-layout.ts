import { findCell, type Table } from '@covert/shared';

export interface ColumnLayout {
  width: number;
  /** Right-aligned with tabular figures, like a ledger. */
  numeric: boolean;
}

const NUMERIC = /^[-+−(]?\s*(?:[₹$€£¥]|rs\.?|inr|usd|eur|gbp)?\s*\d[\d.,\s]*%?\)?\s*(?:cr|dr)?$/i;
const SAMPLE_ROWS = 80;
const CHAR_WIDTH = 8.4;
const PADDING = 32;

export function isNumericLike(value: string): boolean {
  return NUMERIC.test(value.trim());
}

/**
 * Column widths from content length, scaled with the system text size so
 * Dynamic Type never truncates headers. Long text wraps inside its cell.
 */
export function layoutColumns(table: Table, fontScale = 1): ColumnLayout[] {
  const scale = Math.min(Math.max(fontScale, 1), 1.8);
  const sample = table.rows.slice(0, SAMPLE_ROWS);
  return table.columns.map((column, index) => {
    const values = sample.map((row) => findCell(row, column.id)?.value.trim() ?? '');
    const filled = values.filter(Boolean);
    const numeric = filled.length > 0 && filled.filter(isNumericLike).length / filled.length >= 0.7;
    const longest = Math.max(
      Math.min(column.label.length, 24),
      ...values.map((value) => Math.min(value.length, 36)),
    );
    const min = index === 0 ? 112 : 88;
    const width = Math.min(Math.max(longest * CHAR_WIDTH + PADDING, min), 300);
    return { width: Math.round(width * scale), numeric };
  });
}
