import { z } from 'zod';

import { ACCEPTED_MIME_TYPES } from './limits';

/**
 * Domain model for an extracted document.
 *
 * Invariant (enforced by the API's transformation layer): every row holds exactly
 * one cell per column, in column order. Clients may rely on it but should still
 * look cells up by `columnId` rather than by index.
 */

export const MimeTypeSchema = z.enum(ACCEPTED_MIME_TYPES);

export const CellSchema = z.object({
  columnId: z.string().min(1),
  value: z.string(),
  uncertain: z.boolean(),
  /** The raw OCR fragment the value came from, when it differs from the value. */
  sourceText: z.string().optional(),
  /** Set once a person has changed the value. */
  edited: z.boolean().optional(),
});

export const ColumnSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
});

export const RowSchema = z.object({
  id: z.string().min(1),
  cells: z.array(CellSchema),
});

export const TableSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  columns: z.array(ColumnSchema).min(1),
  rows: z.array(RowSchema),
});

export const DocumentStatsSchema = z.object({
  tableCount: z.number().int().nonnegative(),
  rowCount: z.number().int().nonnegative(),
  /** Widest table's column count. */
  columnCount: z.number().int().nonnegative(),
  uncertainCount: z.number().int().nonnegative(),
});

export const DocumentListItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  fileType: MimeTypeSchema,
  pageCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: DocumentStatsSchema,
});

export const DocumentSchema = DocumentListItemSchema.extend({
  summary: z.string(),
  warnings: z.array(z.string()),
  tables: z.array(TableSchema),
  ocrText: z.string(),
});

export type MimeType = z.infer<typeof MimeTypeSchema>;
export type Cell = z.infer<typeof CellSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type Row = z.infer<typeof RowSchema>;
export type Table = z.infer<typeof TableSchema>;
export type DocumentStats = z.infer<typeof DocumentStatsSchema>;
export type DocumentListItem = z.infer<typeof DocumentListItemSchema>;
export type CovertDocument = z.infer<typeof DocumentSchema>;

export function computeStats(tables: readonly Table[]): DocumentStats {
  let rowCount = 0;
  let columnCount = 0;
  let uncertainCount = 0;
  for (const table of tables) {
    rowCount += table.rows.length;
    columnCount = Math.max(columnCount, table.columns.length);
    for (const row of table.rows) {
      for (const cell of row.cells) if (cell.uncertain) uncertainCount += 1;
    }
  }
  return { tableCount: tables.length, rowCount, columnCount, uncertainCount };
}

export function findCell(row: Row, columnId: string): Cell | undefined {
  return row.cells.find((cell) => cell.columnId === columnId);
}

/** Returns a copy of the tables with one cell replaced. Unknown targets return `null`. */
export function updateCellValue(
  tables: readonly Table[],
  target: { tableId: string; rowId: string; columnId: string },
  value: string,
): Table[] | null {
  let found = false;
  const next = tables.map((table) => {
    if (table.id !== target.tableId) return table;
    return {
      ...table,
      rows: table.rows.map((row) => {
        if (row.id !== target.rowId) return row;
        return {
          ...row,
          cells: row.cells.map((cell) => {
            if (cell.columnId !== target.columnId) return cell;
            found = true;
            return { ...cell, value, uncertain: false, edited: true };
          }),
        };
      }),
    };
  });
  return found ? next : null;
}
