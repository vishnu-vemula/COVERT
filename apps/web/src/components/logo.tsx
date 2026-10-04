import { LOGO_LETTERS, LOGO_VIEWBOX } from '@/lib/logo-paths';

interface LogoProps {
  className?: string;
  /** Accessible name; pass `null` when the logo sits next to visible text. */
  label?: string | null;
}

/**
 * The COVERT logotype. Each letter is its own `<g data-letter>` (for scroll
 * effects) wrapping a `<path data-glyph>` (for the intro), so the two
 * animations never fight over the same transform.
 */
export function Logo({ className = '', label = 'COVERT' }: LogoProps) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      className={`block ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {LOGO_LETTERS.map((letter) => (
        <g key={letter.letter} data-letter>
          <path d={letter.d} fillRule="evenodd" data-glyph />
        </g>
      ))}
    </svg>
  );
}
