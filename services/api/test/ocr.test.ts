import { describe, expect, it } from 'vitest';

import { layoutText, type TextAnnotation } from '../src/ocr/layout';
import { hasMeaningfulText, MAX_MODEL_CHARS, prepareOcrText } from '../src/ocr/text';
import { FIXTURE_NAMES, loadOcrText } from './support/fixtures';

type Transform = (x: number, y: number) => { x: number; y: number };

const identity: Transform = (x, y) => ({ x, y });
/** The page photographed rotated 90° clockwise. */
const rotated90: Transform = (x, y) => ({ x: 1000 - y, y: x });
const upsideDown: Transform = (x, y) => ({ x: 1000 - x, y: 1000 - y });

function word(text: string, x: number, y: number, transform: Transform, breakType = 'SPACE') {
  const width = text.length * 10;
  const corners = [
    transform(x, y),
    transform(x + width, y),
    transform(x + width, y + 20),
    transform(x, y + 20),
  ];
  return {
    boundingBox: { vertices: corners },
    symbols: [...text].map((char, index) => ({
      text: char,
      property: index === text.length - 1 ? { detectedBreak: { type: breakType } } : null,
    })),
  };
}

/**
 * A three-column table where Vision returned one block per column, which is
 * how block-ordered `text` scrambles tables.
 */
function columnBlockTable(transform: Transform, skew = 0): TextAnnotation {
  const block = (words: ReturnType<typeof word>[]) => ({ paragraphs: [{ words }] });
  return {
    text: 'Date\n04 Sep\n05 Sep\nUnits\n41\n38\nAmount\n₹331\n₹307',
    pages: [
      {
        blocks: [
          block([
            word('Date', 10, 10, transform),
            word('04', 10, 50, transform),
            word('Sep', 40, 50, transform),
            word('05', 10, 90, transform),
            word('Sep', 40, 90, transform),
          ]),
          block([
            word('Units', 200, 10 + skew, transform),
            word('41', 200, 50 + skew, transform),
            word('38', 200, 90 + skew, transform),
          ]),
          block([
            word('Amount', 320, 10 + skew * 2, transform),
            word('₹331', 320, 50 + skew * 2, transform),
            word('₹307', 320, 90 + skew * 2, transform),
          ]),
        ],
      },
    ],
  };
}

const EXPECTED = 'Date   Units   Amount\n04 Sep   41   ₹331\n05 Sep   38   ₹307';

describe('layoutText', () => {
  it('rebuilds table rows from column-ordered blocks', () => {
    expect(layoutText(columnBlockTable(identity))).toBe(EXPECTED);
  });

  it('tolerates slightly skewed photos', () => {
    expect(layoutText(columnBlockTable(identity, 4))).toBe(EXPECTED);
  });

  it('normalizes pages photographed sideways or upside down', () => {
    expect(layoutText(columnBlockTable(rotated90))).toBe(EXPECTED);
    expect(layoutText(columnBlockTable(upsideDown))).toBe(EXPECTED);
  });

  it('joins punctuation without inventing spaces', () => {
    const annotation: TextAnnotation = {
      pages: [
        {
          blocks: [
            {
              paragraphs: [
                {
                  words: [word('Total', 10, 10, identity, 'UNKNOWN'), word(':', 60, 10, identity)],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(layoutText(annotation)).toBe('Total:');
  });

  it('uses normalized vertices for PDF pages', () => {
    const annotation: TextAnnotation = {
      pages: [
        {
          blocks: [
            {
              paragraphs: [
                {
                  words: [
                    {
                      boundingBox: {
                        vertices: [],
                        normalizedVertices: [
                          { x: 0.1, y: 0.1 },
                          { x: 0.2, y: 0.1 },
                          { x: 0.2, y: 0.12 },
                          { x: 0.1, y: 0.12 },
                        ],
                      },
                      symbols: [{ text: 'P' }, { text: 'D' }, { text: 'F' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(layoutText(annotation)).toBe('PDF');
  });

  it('falls back to plain text when there is no geometry', () => {
    expect(layoutText({ text: ' Hello\nWorld ', pages: [] })).toBe('Hello\nWorld');
    expect(layoutText(null)).toBe('');
  });
});

describe('prepareOcrText', () => {
  it('passes a single page through unchanged', () => {
    const text = loadOcrText('clean-invoice');
    const prepared = prepareOcrText({ pages: [{ pageNumber: 1, text }], totalPages: 1 });
    expect(prepared.modelText).toBe(text.trim());
    expect(prepared.truncated).toBe(false);
  });

  it('marks pages and skips blank ones', () => {
    const prepared = prepareOcrText({
      pages: [
        { pageNumber: 1, text: 'First page' },
        { pageNumber: 2, text: '   ' },
        { pageNumber: 3, text: 'Third page' },
      ],
      totalPages: 3,
    });
    expect(prepared.displayText).toBe('[Page 1]\nFirst page\n\n[Page 3]\nThird page');
  });

  it('bounds the text sent for structuring', () => {
    const prepared = prepareOcrText({
      pages: [{ pageNumber: 1, text: 'x'.repeat(MAX_MODEL_CHARS + 10) }],
      totalPages: 1,
    });
    expect(prepared.truncated).toBe(true);
    expect(prepared.modelText).toHaveLength(MAX_MODEL_CHARS);
  });
});

describe('hasMeaningfulText', () => {
  it.each(FIXTURE_NAMES)('accepts the %s fixture', (name) => {
    expect(hasMeaningfulText(loadOcrText(name))).toBe(true);
  });

  it.each(['', '   \n ', '. , — |', 'ab', '~ x'])('rejects %j', (text) => {
    expect(hasMeaningfulText(text)).toBe(false);
  });

  it('accepts short but real content', () => {
    expect(hasMeaningfulText('Total 42')).toBe(true);
    expect(hasMeaningfulText('合計 1200')).toBe(true);
  });
});
