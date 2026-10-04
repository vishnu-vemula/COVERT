/**
 * Glossy "3D" shapes drawn in SVG: a base gradient, a soft rim and a highlight
 * on the same outline. Decorative only.
 */

function scallopPath(petals: number, depth: number): string {
  const center = 50;
  const outer = 46;
  const inner = outer * (1 - depth);
  const step = (Math.PI * 2) / petals;
  const point = (radius: number, angle: number) =>
    `${(center + radius * Math.cos(angle)).toFixed(2)} ${(center + radius * Math.sin(angle)).toFixed(2)}`;
  let path = `M ${point(inner, -Math.PI / 2)}`;
  for (let i = 0; i < petals; i += 1) {
    const start = -Math.PI / 2 + i * step;
    path += ` C ${point(outer * 1.08, start + step * 0.08)} ${point(outer * 1.08, start + step * 0.92)} ${point(inner, start + step)}`;
  }
  return `${path} Z`;
}

const PATHS = {
  flower: scallopPath(6, 0.2),
  clover: scallopPath(4, 0.46),
  ring: 'M4 50a46 46 0 1 0 92 0a46 46 0 1 0-92 0ZM31 50a19 19 0 1 0 38 0a19 19 0 1 0-38 0Z',
  bolt: 'M60 3 16 58h30l-8 39 46-58H54l6-36Z',
  capsule: 'M28 27h44a23 23 0 0 1 0 46H28a23 23 0 0 1 0-46Z',
} as const;

const FILLS = {
  cobalt: 'url(#cv-cobalt)',
  chrome: 'url(#cv-chrome)',
  pearl: 'url(#cv-pearl)',
} as const;

export type ShapeKind = keyof typeof PATHS;
export type ShapeTone = keyof typeof FILLS;

interface ShapeProps {
  kind: ShapeKind;
  tone?: ShapeTone;
  className?: string;
}

export function Shape({ kind, tone = 'cobalt', className = '' }: ShapeProps) {
  const d = PATHS[kind];
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      overflow="visible"
      className={`drop-shadow-[0_28px_30px_rgba(0,0,0,0.28)] ${className}`}>
      <path d={d} fill={FILLS[tone]} fillRule="evenodd" strokeLinejoin="round" />
      <path d={d} fill="url(#cv-rim)" fillRule="evenodd" />
      <path d={d} fill="url(#cv-gloss)" fillRule="evenodd" />
    </svg>
  );
}

/** Gradients the shapes reference. Rendered once, in the root layout. */
export function ShapeDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <radialGradient id="cv-cobalt" cx="32%" cy="28%" r="85%">
          <stop offset="0" stopColor="#a3b1ff" />
          <stop offset="0.3" stopColor="#4a67ff" />
          <stop offset="0.72" stopColor="#2341e6" />
          <stop offset="1" stopColor="#12238a" />
        </radialGradient>
        <radialGradient id="cv-pearl" cx="32%" cy="28%" r="85%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f2efe8" />
          <stop offset="0.85" stopColor="#c9c5ba" />
          <stop offset="1" stopColor="#9f9b90" />
        </radialGradient>
        <linearGradient id="cv-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f7f5" />
          <stop offset="0.2" stopColor="#8d8d8a" />
          <stop offset="0.36" stopColor="#1d1d1c" />
          <stop offset="0.52" stopColor="#d9d9d6" />
          <stop offset="0.6" stopColor="#f7f7f5" />
          <stop offset="0.78" stopColor="#5c5c59" />
          <stop offset="1" stopColor="#e6e6e3" />
        </linearGradient>
        <radialGradient id="cv-rim" cx="36%" cy="30%" r="90%">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </radialGradient>
        <radialGradient id="cv-gloss" cx="30%" cy="22%" r="42%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
