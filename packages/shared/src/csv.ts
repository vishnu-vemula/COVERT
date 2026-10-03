import { findCell, type Table } from './document';

/**
 * RFC 4180 CSV: comma separated, CRLF line endings, fields wrapped in double
 * quotes when they contain a comma, quote, CR or LF, with quotes doubled.
 */
export function toCsv(table: Table): string {
  return toMatrix(table)
    .map((record) => record.map(escapeCsvField).join(','))
    .join('\r\n');
}

/** Tab-separated text for pasting into spreadsheets and notes. */
export function toTsv(table: Table): string {
  return toMatrix(table)
    .map((record) => record.map((value) => value.replace(/[\t\r\n]+/g, ' ').trim()).join('\t'))
    .join('\n');
}

export function escapeCsvField(raw: string): string {
  const value = neutralizeFormula(raw);
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Spreadsheet apps execute cells beginning with = + - @ as formulas. Prefix those
 * with an apostrophe unless the value is plainly a number such as "-42.50".
 */
function neutralizeFormula(value: string): string {
  if (!/^[=+\-@\t\r]/.test(value)) return value;
  if (/^[+-]?[\d\s.,]+%?$/.test(value)) return value;
  return `'${value}`;
}

function toMatrix(table: Table): string[][] {
  const header = table.columns.map((column) => column.label);
  const rows = table.rows.map((row) =>
    table.columns.map((column) => findCell(row, column.id)?.value ?? ''),
  );
  return [header, ...rows];
}

/** File-system-safe name derived from a document or table title. */
export function exportFileName(title: string, extension: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  return `${base || 'covert-table'}.${extension}`;
}
