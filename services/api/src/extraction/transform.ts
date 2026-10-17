import { LIMITS, type Cell, type Column, type Row, type Table } from '@covert/shared';

import { AppError } from '../errors';
import type { ExtractedCell, ExtractedTable, Extraction } from './schema';

export interface StructuredResult {
  title: string;
  summary: string;
  tables: Table[];
  warnings: string[];
}

const OTHER_COLUMN_LABEL = 'Other';
const MAX_WARNINGS = 8;

/**
 * Turns validated model output into COVERT's domain tables.
 *
 * Guarantees: stable ids, exactly one cell per column per row in column order,
 * and no value from the model is dropped. Cells that reference an unknown or
 * already-filled column are kept in an "Other" column and marked uncertain.
 * Only rows without any value are removed.
 */
export function transformExtraction(extraction: Extraction, ocrText?: string): StructuredResult {
  const warnings: string[] = [];
  const tables: Table[] = [];

  for (const source of extraction.tables) {
    const table = toTable(source, tables.length + 1, warnings);
    if (table) tables.push(table);
  }

  if (ocrText !== undefined) {
    const source = comparable(ocrText);
    let flagged = false;
    for (const table of tables) {
      for (const row of table.rows) {
        for (const cell of row.cells) {
          if (!cell.value) continue;
          const value = comparable(cell.value);
          const corrected = cell.sourceText !== undefined && comparable(cell.sourceText) !== value;
          if (corrected || !source.includes(value)) {
            cell.uncertain = true;
            flagged = true;
          }
        }
      }
    }
    if (flagged)
      warnings.push(
        'Some values could not be verified against the recognized text. Review the flagged cells.',
      );
  }

  const title = clean(extraction.title, LIMITS.maxTitleLength) || 'Untitled document';
  const summary = clean(extraction.summary, 600) || describe(tables);
  const modelWarnings = extraction.warnings.map((warning) => clean(warning, 300)).filter(Boolean);

  return {
    title,
    summary,
    tables,
    warnings: [...new Set([...modelWarnings, ...warnings])].slice(0, MAX_WARNINGS),
  };
}

function toTable(source: ExtractedTable, tableNumber: number, warnings: string[]): Table | null {
  const declared =
    source.columns.length > 0
      ? source.columns
      : uniqueColumnIds(source).map((id) => ({ id, label: humanize(id) }));

  const columns: Column[] = [];
  // Source id → new ids, in order. Duplicate source ids map to several columns.
  const idsBySource = new Map<string, string[]>();
  declared.forEach((column, index) => {
    const id = `c${index + 1}`;
    columns.push({ id, label: clean(column.label) || `Column ${index + 1}` });
    const key = column.id.trim();
    idsBySource.set(key, [...(idsBySource.get(key) ?? []), id]);
  });

  let usedOther = false;
  const built = source.rows.map((row) => {
    const placed = new Map<string, Cell>();
    const leftovers: ExtractedCell[] = [];

    for (const cell of row.cells) {
      const target = (idsBySource.get(cell.columnId.trim()) ?? []).find((id) => !placed.has(id));
      if (target) placed.set(target, toCell(target, cell));
      else if (clean(cell.value)) leftovers.push(cell);
    }

    const cells = columns.map(
      (column) => placed.get(column.id) ?? { columnId: column.id, value: '', uncertain: false },
    );
    if (leftovers.length > 0) usedOther = true;
    return { cells, leftovers };
  });

  if (usedOther) {
    const otherId = `c${columns.length + 1}`;
    columns.push({ id: otherId, label: OTHER_COLUMN_LABEL });
    for (const row of built) {
      const value = checkedValue(row.leftovers.map((cell) => clean(cell.value)).join(' · '));
      row.cells.push(
        value
          ? { columnId: otherId, value, uncertain: true }
          : { columnId: otherId, value: '', uncertain: false },
      );
    }
    warnings.push('Some values didn’t match a column and were kept under “Other”.');
  }

  const rows: Row[] = built
    .filter((row) => row.cells.some((cell) => cell.value !== ''))
    .map((row, index) => ({ id: `r${index + 1}`, cells: row.cells }));

  if (rows.length === 0) return null;
  return {
    id: `t${tableNumber}`,
    title: clean(source.title, LIMITS.maxTitleLength) || `Table ${tableNumber}`,
    columns,
    rows,
  };
}

function toCell(columnId: string, source: ExtractedCell): Cell {
  const value = checkedValue(clean(source.value));
  const sourceText = source.sourceText === null ? '' : clean(source.sourceText);
  const cell: Cell = { columnId, value, uncertain: source.uncertain };
  if (sourceText && sourceText !== value) cell.sourceText = sourceText;
  return cell;
}

function uniqueColumnIds(table: ExtractedTable): string[] {
  const ids: string[] = [];
  for (const row of table.rows) {
    for (const cell of row.cells) {
      const id = cell.columnId.trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

function clean(value: string, max: number = Infinity): string {
  return value.replace(/\r\n?/g, '\n').trim().slice(0, max);
}

/** Fail explicitly instead of saving a value that has silently lost its ending. */
function checkedValue(value: string): string {
  if (value.length > LIMITS.maxCellLength) throw new AppError('DOCUMENT_TOO_LARGE');
  return value;
}

/** Only whitespace normalization is allowed when matching a value to OCR. */
function comparable(value: string): string {
  return value.replace(/\s+/gu, '');
}

function humanize(id: string): string {
  const words = id.replace(/[_-]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Column';
}

function describe(tables: Table[]): string {
  const rows = tables.reduce((sum, table) => sum + table.rows.length, 0);
  const noun = rows === 1 ? 'record' : 'records';
  if (tables.length <= 1) return `${rows} ${noun} extracted.`;
  return `${rows} ${noun} extracted across ${tables.length} tables.`;
}
