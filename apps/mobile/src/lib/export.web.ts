import { exportFileName, toCsv, toTsv, type Table } from '@covert/shared';
import * as Clipboard from 'expo-clipboard';

export class ExportError extends Error {}

/** Web (development preview): download the CSV instead of a share sheet. */
export async function shareCsv(table: Table, documentTitle: string): Promise<void> {
  const blob = new Blob(['﻿', toCsv(table)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName(`${documentTitle} ${table.title}`, 'csv');
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyTable(table: Table): Promise<void> {
  const ok = await Clipboard.setStringAsync(toTsv(table));
  if (!ok) throw new ExportError('The table couldn’t be copied. Try again.');
}
