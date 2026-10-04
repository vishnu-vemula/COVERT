import type { ReactNode } from 'react';

import { SAMPLE_ROWS, SAMPLE_TITLE, UNCERTAIN_ROW } from '@/lib/sample';

import { ReaderBarVisual } from './reader-bar-visual';

const READING_ROW = 3;
const TOTAL_ROWS = 30;

/**
 * The result screen of the app, rebuilt in HTML: the same green screen,
 * document card, Read and Export tiles, table and audio controls a person sees
 * after converting a bill.
 */
export function PhoneDemo() {
  return (
    <div className="relative mx-auto w-full">
      <figure
        role="img"
        aria-label={`The COVERT app showing “${SAMPLE_TITLE}” as a table of ${TOTAL_ROWS} rows and 3 columns, with row 4 being read aloud.`}
        className="relative rounded-[50px] bg-ink p-[9px] shadow-[0_40px_80px_-30px_rgba(11,11,10,0.55)] ring-1 ring-white/10">
        <div className="relative flex aspect-[9/19.4] flex-col overflow-hidden rounded-[42px] bg-green">
          <StatusBar />
          <div className="flex flex-1 flex-col gap-2.5 px-4 pt-1">
            <div className="flex items-center justify-between">
              <Circle>
                <path d="M15 5l-7 7 7 7" />
              </Circle>
              <span className="text-[10px] font-medium text-secondary">JPG</span>
              <Circle>
                <circle cx="6" cy="12" r="1.3" fill="currentColor" />
                <circle cx="12" cy="12" r="1.3" fill="currentColor" />
                <circle cx="18" cy="12" r="1.3" fill="currentColor" />
              </Circle>
            </div>

            <div>
              <p className="text-[19px] font-bold leading-[1.15] tracking-[-0.02em]">
                {SAMPLE_TITLE}
              </p>
              <p className="mt-1 text-[10px] font-medium text-secondary">Oct 3, 2026, 9:12 AM</p>
            </div>

            <div className="rounded-[20px] bg-yellow p-2.5">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-surface">
                  <TableGlyph />
                </span>
                <span className="flex-1">
                  <span className="block text-[10px] font-semibold">Extracted data</span>
                  <span className="block text-[8px] text-secondary">JPG</span>
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3">
                {[
                  ['Rows', String(TOTAL_ROWS)],
                  ['Columns', '3'],
                  ['Tables', '1'],
                ].map(([label, value], index) => (
                  <div key={label} className={`px-2 ${index > 0 ? 'border-l border-ink/15' : ''}`}>
                    <p className="text-[8px] font-medium text-secondary">{label}</p>
                    <p className="text-[21px] font-bold leading-tight tracking-[-0.03em] tabular">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-review" />
                <span className="flex-1 text-[9px] font-semibold">Review uncertain values</span>
                <span className="text-[8px] text-secondary">1</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <span className="rounded-[18px] bg-blue-deep p-2.5">
                <span className="block text-[12px] font-semibold">Read</span>
                <span className="mt-0.5 block text-[8px] text-secondary">Hear every row</span>
              </span>
              <span className="rounded-[18px] bg-surface p-2.5">
                <span className="block text-[12px] font-semibold">Export</span>
                <span className="mt-0.5 block text-[8px] text-secondary">CSV, copy or share</span>
              </span>
            </div>

            <div className="overflow-hidden rounded-[16px] bg-surface">
              <div className="grid grid-cols-[1.2fr_0.8fr_1fr] border-b-[1.5px] border-ink bg-canvas-deep px-2.5 py-1.5 text-[10px] font-bold">
                <span>Date</span>
                <span className="text-right">Units</span>
                <span className="text-right">Amount</span>
              </div>
              {SAMPLE_ROWS.slice(0, 4).map((row, index) => (
                <div
                  key={row.date}
                  className={`grid grid-cols-[1.2fr_0.8fr_1fr] border-b border-border px-2.5 py-[6px] text-[11px] tabular last:border-0 ${index === READING_ROW ? 'bg-yellow-soft' : ''}`}>
                  <span>{row.date}</span>
                  <span className="text-right">{row.units}</span>
                  <span className="text-right">
                    {index === UNCERTAIN_ROW ? (
                      <span className="relative rounded-[4px] bg-review-wash px-1 py-0.5">
                        {row.amount}
                        <span className="absolute -right-1 -top-0.5 size-1 rounded-full bg-review" />
                      </span>
                    ) : (
                      row.amount
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-3 bottom-4">
            <ReaderBarVisual status={`Row ${READING_ROW + 1} of ${TOTAL_ROWS}`} compact />
          </div>
        </div>
      </figure>
    </div>
  );
}

function StatusBar() {
  return (
    <div aria-hidden className="flex items-center justify-between px-6 pb-2 pt-3">
      <span className="text-[11px] font-semibold tabular">9:41</span>
      <span className="h-[22px] w-[84px] rounded-full bg-ink" />
      <span className="flex items-center gap-1">
        <span className="h-[7px] w-3 rounded-[2px] bg-ink" />
        <span className="h-[8px] w-[18px] rounded-[3px] border border-ink p-[1px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
        </span>
      </span>
    </div>
  );
}

function Circle({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-[30px] place-items-center rounded-full bg-surface/60">
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

function TableGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
    </svg>
  );
}
