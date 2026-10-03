/**
 * Rebuilds reading lines from word positions.
 *
 * Cloud Vision orders `fullTextAnnotation.text` by blocks, which for tables
 * often means column by column. Grouping words by vertical position keeps each
 * table row on one line, and wide horizontal gaps are kept as runs of spaces so
 * column boundaries survive into the structuring step.
 */

interface VisionPoint {
  x?: number | null;
  y?: number | null;
}

interface VisionBox {
  vertices?: VisionPoint[] | null;
  normalizedVertices?: VisionPoint[] | null;
}

interface VisionSymbol {
  text?: string | null;
  property?: { detectedBreak?: { type?: string | number | null } | null } | null;
}

/** The subset of Cloud Vision's `TextAnnotation` that COVERT reads. Every level may be missing. */
export interface TextAnnotation {
  text?: string | null;
  pages?:
    | {
        blocks?:
          | {
              paragraphs?:
                | { words?: { boundingBox?: VisionBox | null; symbols?: VisionSymbol[] | null }[] | null }[]
                | null;
            }[]
          | null;
      }[]
    | null;
}

interface Point {
  x: number;
  y: number;
}

interface PlacedWord {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Whether the OCR engine detected a space (or line end) after this word. */
  spaceAfter: boolean;
}

const NO_SPACE_BREAKS = new Set(['UNKNOWN', 'HYPHEN', 0, 4]);

export function layoutText(annotation: TextAnnotation | null | undefined): string {
  if (!annotation || typeof annotation !== 'object') return '';

  const words = collectWords(annotation);
  if (words.length === 0) return (annotation.text ?? '').trim();

  const lines = groupIntoLines(words);
  const charWidth = medianCharWidth(words);
  return lines
    .map((line) => joinLine(line, charWidth))
    .filter((line) => line.trim().length > 0)
    .join('\n')
    .trim();
}

function collectWords(annotation: TextAnnotation): PlacedWord[] {
  const raw: { text: string; points: Point[]; spaceAfter: boolean }[] = [];
  for (const page of annotation.pages ?? []) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const symbols = word.symbols ?? [];
          const text = symbols.map((symbol) => symbol.text ?? '').join('');
          const points = boxPoints(word.boundingBox);
          if (!text.trim() || points.length < 4) continue;
          const breakType = symbols.at(-1)?.property?.detectedBreak?.type;
          raw.push({ text, points, spaceAfter: breakType != null && !NO_SPACE_BREAKS.has(breakType) });
        }
      }
    }
  }

  const rotate = orientationTransform(raw.map((word) => word.points));
  return raw.map(({ text, points, spaceAfter }) => {
    const rotated = points.map(rotate);
    const xs = rotated.map((p) => p.x);
    const ys = rotated.map((p) => p.y);
    return {
      text,
      spaceAfter,
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    };
  });
}

function boxPoints(box: VisionBox | null | undefined): Point[] {
  const toPoints = (list: VisionPoint[] | null | undefined) =>
    (list ?? []).map((p) => ({ x: p.x ?? 0, y: p.y ?? 0 }));
  const vertices = toPoints(box?.vertices);
  if (vertices.length >= 4 && vertices.some((p) => p.x !== 0 || p.y !== 0)) return vertices;
  return toPoints(box?.normalizedVertices);
}

/**
 * Vision lists word corners in reading order (top-left, top-right, …), so the
 * first edge gives the text direction. Pages photographed sideways or upside
 * down are rotated so text runs left to right before lines are grouped.
 */
function orientationTransform(boxes: Point[][]): (p: Point) => Point {
  const votes = [0, 0, 0, 0];
  for (const points of boxes) {
    const [a, b] = points;
    if (!a || !b) continue;
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const bucket = ((Math.round(angle / 90) % 4) + 4) % 4;
    votes[bucket] = (votes[bucket] ?? 0) + 1;
  }
  const dominant = votes.indexOf(Math.max(...votes));
  switch (dominant) {
    case 1:
      return ({ x, y }) => ({ x: y, y: -x });
    case 2:
      return ({ x, y }) => ({ x: -x, y: -y });
    case 3:
      return ({ x, y }) => ({ x: -y, y: x });
    default:
      return (p) => p;
  }
}

function groupIntoLines(words: PlacedWord[]): PlacedWord[][] {
  const sorted = [...words].sort((a, b) => center(a) - center(b));
  const lines: { words: PlacedWord[]; y0: number; y1: number }[] = [];

  for (const word of sorted) {
    let best: (typeof lines)[number] | undefined;
    let bestOverlap = 0;
    // Only recent lines can overlap because words are sorted by vertical centre.
    for (const line of lines.slice(-4)) {
      const overlap = Math.min(line.y1, word.y1) - Math.max(line.y0, word.y0);
      const smaller = Math.min(line.y1 - line.y0, word.y1 - word.y0);
      if (smaller > 0 && overlap / smaller >= 0.5 && overlap > bestOverlap) {
        best = line;
        bestOverlap = overlap;
      }
    }
    if (best) {
      best.words.push(word);
    } else {
      lines.push({ words: [word], y0: word.y0, y1: word.y1 });
    }
  }

  return lines
    .sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2)
    .map((line) => line.words.sort((a, b) => a.x0 - b.x0));
}

function joinLine(words: PlacedWord[], charWidth: number): string {
  let out = '';
  words.forEach((word, index) => {
    const previous = words[index - 1];
    if (previous) {
      const gap = word.x0 - previous.x1;
      if (gap > charWidth * 2.5) out += '   ';
      else if (previous.spaceAfter || gap > charWidth * 0.6) out += ' ';
    }
    out += word.text;
  });
  return out;
}

function center(word: PlacedWord): number {
  return (word.y0 + word.y1) / 2;
}

function medianCharWidth(words: PlacedWord[]): number {
  const widths = words
    .filter((word) => word.text.length > 0)
    .map((word) => (word.x1 - word.x0) / word.text.length)
    .sort((a, b) => a - b);
  return widths[Math.floor(widths.length / 2)] ?? 1;
}
