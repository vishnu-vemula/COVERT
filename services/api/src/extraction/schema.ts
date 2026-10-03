import { z } from 'zod';

/**
 * The exact shape the structuring model must return (OpenAI Structured Outputs,
 * strict mode). Strict mode requires every property, so optional data is
 * expressed as `nullable`. Rows hold explicit cells keyed by column id rather than
 * objects with dynamic keys, which keeps the schema stable.
 *
 * The same schema validates the response again on the server.
 */

export const ExtractedCellSchema = z.object({
  columnId: z.string(),
  value: z.string(),
  uncertain: z.boolean(),
  sourceText: z.string().nullable(),
});

export const ExtractedColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const ExtractedRowSchema = z.object({
  id: z.string(),
  cells: z.array(ExtractedCellSchema),
});

export const ExtractedTableSchema = z.object({
  id: z.string(),
  title: z.string(),
  columns: z.array(ExtractedColumnSchema),
  rows: z.array(ExtractedRowSchema),
});

export const ExtractionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tables: z.array(ExtractedTableSchema),
  warnings: z.array(z.string()),
});

export type ExtractedCell = z.infer<typeof ExtractedCellSchema>;
export type ExtractedTable = z.infer<typeof ExtractedTableSchema>;
export type Extraction = z.infer<typeof ExtractionSchema>;
