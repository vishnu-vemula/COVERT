import type { DocumentListItem, MimeType } from '@covert/shared';

export function plural(count: number, noun: string): string {
  return `${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;
}

/** "Oct 3" this year, "Oct 3, 2025" otherwise. */
export function formatDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "12 rows · 5 columns", with the table count when there is more than one. */
export function shapeLabel(stats: DocumentListItem['stats']): string {
  const parts = [plural(stats.rowCount, 'row'), plural(stats.columnCount, 'column')];
  if (stats.tableCount > 1) parts.push(plural(stats.tableCount, 'table'));
  return parts.join(' · ');
}

export function fileTypeLabel(type: MimeType): string {
  return type === 'application/pdf' ? 'PDF' : type === 'image/png' ? 'PNG' : 'JPG';
}

/** Groups items into "October 2026"-style sections, newest first, preserving order. */
export function groupByMonth<T extends { createdAt: string }>(items: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const date = new Date(item.createdAt);
    const label = Number.isNaN(date.getTime())
      ? 'Earlier'
      : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const last = groups.at(-1);
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
