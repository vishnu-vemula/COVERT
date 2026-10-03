import { exportFileName, toCsv, toTsv, type Table } from '@covert/shared';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Excel reads UTF-8 CSV correctly (₹, €, accents) only with a byte-order mark. */
const BOM = '﻿';

export class ExportError extends Error {}

/** Writes the table as CSV and opens the system share sheet. */
export async function shareCsv(table: Table, documentTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new ExportError('Sharing isn’t available on this device. Copy the table instead.');
  }
  const name = exportFileName(
    table.title === documentTitle ? documentTitle : `${documentTitle} ${table.title}`,
    'csv',
  );
  let file: File;
  try {
    file = new File(Paths.cache, name);
    file.create({ overwrite: true });
    file.write(BOM + toCsv(table));
  } catch (error) {
    throw new ExportError('The CSV file couldn’t be created. Try again.', { cause: error });
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: `Export ${table.title}`,
  });
}

/** Copies the table as tab-separated text, which pastes cleanly into spreadsheets. */
export async function copyTable(table: Table): Promise<void> {
  const ok = await Clipboard.setStringAsync(toTsv(table));
  if (!ok) throw new ExportError('The table couldn’t be copied. Try again.');
}
