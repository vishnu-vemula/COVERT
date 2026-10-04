import type { ReactNode } from 'react';

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'paper' | 'night' | 'cobalt' | 'outline';
  size?: 'md' | 'lg';
  className?: string;
}

const variants = {
  paper: 'bg-paper text-ink hover:bg-white',
  night: 'bg-night text-paper hover:bg-night-3',
  cobalt: 'bg-cobalt text-white hover:bg-cobalt-deep',
  outline: 'border border-current/35 hover:border-current',
} as const;

/** Anchor styled as a pill. The arrow, when present, nudges on hover. */
export function ButtonLink({
  href,
  children,
  variant = 'night',
  size = 'lg',
  className = '',
}: ButtonLinkProps) {
  const shape = size === 'lg' ? 'h-14 pl-7 pr-2.5 text-[16px]' : 'h-10 pl-4 pr-1.5 text-[14px]';
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-3 rounded-full font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] motion-reduce:active:scale-100 ${shape} ${variants[variant]} ${className}`}>
      {children}
    </a>
  );
}

/** The circled arrow that ends a pill button. */
export function ArrowBadge({
  className = '',
  size = 'lg',
}: {
  className?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full ${size === 'lg' ? 'size-10' : 'size-7'} ${className}`}>
      <ArrowUpRight className="transition-transform duration-300 ease-out-expo group-hover:-translate-y-px group-hover:translate-x-px group-hover:rotate-45" />
    </span>
  );
}

export function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`size-[16px] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/** The doubled chevron used between pipeline stages. */
export function Chevrons({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 12" className={`h-3 w-5 ${className}`} fill="currentColor">
      <path d="M0 0 7 6 0 12ZM9 0l7 6-7 6Z" />
    </svg>
  );
}
