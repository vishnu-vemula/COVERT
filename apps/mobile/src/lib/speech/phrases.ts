import { findCell, type CovertDocument, type Table } from '@covert/shared';

import { BLANK, speakableValue } from './speakable';
import { numberToWords } from './words';

/** Column headers that speech engines would otherwise spell out letter by letter. */
const LABELS: Record<string, string> = {
  '#': 'Number',
  'no': 'Number',
  'no.': 'Number',
  'sl no': 'Number',
  'sl. no.': 'Number',
  'qty': 'Quantity',
  'amt': 'Amount',
  'ref': 'Reference',
  'ref no': 'Reference number',
  'desc': 'Description',
  'bal': 'Balance',
  'dr': 'Debit',
  'cr': 'Credit',
};

export function speakableLabel(label: string): string {
  const key = label.trim().toLowerCase();
  return LABELS[key] ?? (speakableValue(label) === BLANK ? 'Column' : speakableValue(label));
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function sentence(parts: string[]): string {
  return parts
    .map((part) => part.trim().replace(/[.,;:]+$/, ''))
    .filter(Boolean)
    .join('. ')
    .concat('.');
}

/** "Row three. Date, September 4. Units, 41. Amount, 331 rupees." */
export function rowPhrase(table: Table, rowIndex: number, readColumnNames: boolean): string {
  const row = table.rows[rowIndex];
  if (!row) return '';
  const values = table.columns.map((column) => {
    const value = speakableValue(findCell(row, column.id)?.value ?? '');
    return readColumnNames ? `${speakableLabel(column.label)}, ${value}` : value;
  });
  return sentence([`Row ${numberToWords(rowIndex + 1)}`, ...values]);
}

export function tableIntro(table: Table): string {
  return sentence([
    table.title,
    `${plural(table.rows.length, 'row')}, ${plural(table.columns.length, 'column')}`,
  ]);
}

export function summaryPhrase(document: CovertDocument): string {
  const { stats } = document;
  const contents =
    stats.tableCount > 1
      ? `It contains ${plural(stats.tableCount, 'table')} with ${plural(stats.rowCount, 'record')}`
      : `It contains ${plural(stats.rowCount, 'record')} across ${plural(stats.columnCount, 'column')}`;
  const uncertain =
    stats.uncertainCount > 0
      ? `${plural(stats.uncertainCount, 'value')} ${stats.uncertainCount === 1 ? 'is' : 'are'} marked uncertain`
      : '';
  return sentence([document.title, document.summary, contents, uncertain]);
}

/**
 * Splits text into utterances no longer than `max` characters, breaking at
 * sentence ends where possible, so long passages never exceed engine limits
 * and stop quickly when asked.
 */
export function splitForSpeech(text: string, max = 600): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const piece of sentences) {
    if ((current + piece).length > max && current) {
      chunks.push(current.trim());
      current = '';
    }
    if (piece.length > max) {
      for (let i = 0; i < piece.length; i += max) chunks.push(piece.slice(i, i + max).trim());
    } else {
      current += piece;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}
