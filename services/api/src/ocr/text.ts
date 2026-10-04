import type { OcrResult } from './types';

/** Upper bound on OCR characters sent for structuring; keeps requests fast and bounded. */
export const MAX_MODEL_CHARS = 60_000;

export interface PreparedText {
  /** Text with page markers, as sent to the structuring model. */
  modelText: string;
  /** Text shown to people under "Original text". */
  displayText: string;
  truncated: boolean;
}

export function prepareOcrText(result: OcrResult): PreparedText {
  const multiPage = result.pages.length > 1;
  const sections = result.pages
    .filter((page) => page.text.trim().length > 0)
    .map((page) =>
      multiPage ? `[Page ${page.pageNumber}]\n${page.text.trim()}` : page.text.trim(),
    );
  const displayText = sections.join('\n\n');
  const truncated = displayText.length > MAX_MODEL_CHARS;
  return {
    modelText: truncated ? displayText.slice(0, MAX_MODEL_CHARS) : displayText,
    displayText,
    truncated,
  };
}

/**
 * True when OCR produced something worth structuring rather than stray marks:
 * at least two tokens and a handful of letters or digits.
 */
export function hasMeaningfulText(text: string): boolean {
  const tokens = text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token));
  const alphanumeric = text.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  return tokens.length >= 2 && alphanumeric >= 4;
}
