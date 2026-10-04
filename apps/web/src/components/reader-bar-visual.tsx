/** A faithful, static rendering of the app's audio controls. Decorative. */
export function ReaderBarVisual({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const pad = compact ? 'p-2 gap-2 rounded-[20px]' : 'p-3 gap-3 rounded-[32px]';
  const control = compact ? 'size-8' : 'size-11';
  const play = compact ? 'size-11' : 'size-14';
  return (
    <div
      aria-hidden
      className={`flex flex-col bg-ink text-on-ink ${pad} shadow-[0_18px_40px_-18px_rgba(17,19,17,0.6)]`}>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 gap-1 rounded-full bg-white/[0.08] p-1">
          <span
            className={`flex-1 rounded-full text-center font-semibold text-on-ink ${compact ? 'py-1 text-[10px]' : 'py-2 text-[13px]'}`}>
            Summary
          </span>
          <span
            className={`flex-1 rounded-full bg-signal text-center font-semibold text-ink ${compact ? 'py-1 text-[10px]' : 'py-2 text-[13px]'}`}>
            Table
          </span>
        </div>
        <span
          className={`grid place-items-center rounded-full border border-on-ink/30 font-bold tabular ${compact ? 'h-7 px-2 text-[10px]' : 'h-10 px-3 text-[13px]'}`}>
          1×
        </span>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <span
          className={`flex-1 truncate text-on-ink-muted tabular ${compact ? 'text-[11px]' : 'text-[15px]'}`}>
          {status}
        </span>
        <span className={`grid ${control} place-items-center rounded-full bg-white/10`}>
          <Glyph d="M7 6v12M18 6l-8 6 8 6z" compact={compact} />
        </span>
        <span className={`grid ${play} place-items-center rounded-full bg-signal text-ink`}>
          <span className={`${compact ? 'size-3' : 'size-4'} rounded-[3px] bg-ink`} />
        </span>
        <span className={`grid ${control} place-items-center rounded-full bg-white/10`}>
          <Glyph d="M17 6v12M6 6l8 6-8 6z" compact={compact} />
        </span>
      </div>
    </div>
  );
}

function Glyph({ d, compact }: { d: string; compact: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={compact ? 'size-3.5' : 'size-5'}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
