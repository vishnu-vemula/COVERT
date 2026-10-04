import type { CovertDocument, Table } from '@covert/shared';
import { computeStats } from '@covert/shared';
import { describe, expect, it } from 'vitest';

import {
  rowPhrase,
  speakableLabel,
  splitForSpeech,
  summaryPhrase,
  tableIntro,
} from '@/lib/speech/phrases';
import { speakableProse, speakableValue } from '@/lib/speech/speakable';
import { numberToWords } from '@/lib/speech/words';

const readings: Table = {
  id: 't1',
  title: 'Daily readings',
  columns: [
    { id: 'c1', label: 'Date' },
    { id: 'c2', label: 'Units' },
    { id: 'c3', label: 'Amount' },
  ],
  rows: [
    {
      id: 'r1',
      cells: [
        { columnId: 'c1', value: '02 Sep', uncertain: false },
        { columnId: 'c2', value: '39', uncertain: false },
        { columnId: 'c3', value: '₹315', uncertain: false },
      ],
    },
    {
      id: 'r2',
      cells: [
        { columnId: 'c1', value: '03 Sep', uncertain: false },
        { columnId: 'c2', value: '', uncertain: false },
        { columnId: 'c3', value: '₹0', uncertain: true },
      ],
    },
    {
      id: 'r3',
      cells: [
        { columnId: 'c1', value: '04 Sep', uncertain: false },
        { columnId: 'c2', value: '41', uncertain: false },
        { columnId: 'c3', value: '₹331', uncertain: false },
      ],
    },
  ],
};

describe('numberToWords', () => {
  it.each([
    [0, 'zero'],
    [3, 'three'],
    [19, 'nineteen'],
    [41, 'forty-one'],
    [100, 'one hundred'],
    [331, 'three hundred thirty-one'],
    [1000, 'one thousand'],
    [12_045, 'twelve thousand forty-five'],
  ])('%i → %s', (value, words) => {
    expect(numberToWords(value)).toBe(words);
  });

  it('leaves values it cannot spell as digits', () => {
    expect(numberToWords(2.5)).toBe('2.5');
    expect(numberToWords(-1)).toBe('-1');
  });
});

describe('speakableValue', () => {
  it.each([
    ['₹331', '331 rupees'],
    ['Rs. 1,200.50', '1,200.50 rupees'],
    ['$1', '1 dollar'],
    ['-€10.00', 'minus 10.00 euros'],
    ['(£45)', 'minus 45 pounds'],
    ['14%', '14 percent'],
    ['04 Sep', 'September 4'],
    ['01-Aug-2024', 'August 1, 2024'],
    ['Sep 4, 2024', 'September 4, 2024'],
    ['2024-09-04', 'September 4, 2024'],
    ['UPI/RENT/AUG', 'UPI RENT AUG'],
    ['A | B', 'A B'],
    ['', 'blank'],
    ['—', 'blank'],
    ['INV-2024-0193', 'INV-2024-0193'],
  ])('%j → %j', (input, spoken) => {
    expect(speakableValue(input)).toBe(spoken);
  });

  it('does not treat currency-prefixed text as an amount', () => {
    expect(speakableValue('$ see note')).toBe('$ see note');
  });
});

describe('speakableProse', () => {
  it('rewrites amounts and percentages inside sentences', () => {
    expect(speakableProse('Totalling ₹2,737.60 including 18% GST, down from $1 and Rs. 40.')).toBe(
      'Totalling 2,737.60 rupees including 18 percent GST, down from 1 dollar and 40 rupees.',
    );
  });

  it('leaves other text alone', () => {
    expect(speakableProse('Invoice INV-2024-0193 for 4 items.')).toBe(
      'Invoice INV-2024-0193 for 4 items.',
    );
  });
});

describe('speakableLabel', () => {
  it('expands abbreviations engines spell out', () => {
    expect(speakableLabel('#')).toBe('Number');
    expect(speakableLabel('Qty')).toBe('Quantity');
    expect(speakableLabel('Amount')).toBe('Amount');
  });
});

describe('rowPhrase', () => {
  it('reads a record semantically with column names', () => {
    expect(rowPhrase(readings, 2, true)).toBe(
      'Row three. Date, September 4. Units, 41. Amount, 331 rupees.',
    );
  });

  it('reads values alone when column names are off', () => {
    expect(rowPhrase(readings, 0, false)).toBe('Row one. September 2. 39. 315 rupees.');
  });

  it('says blank for empty cells instead of skipping them', () => {
    expect(rowPhrase(readings, 1, true)).toBe(
      'Row two. Date, September 3. Units, blank. Amount, 0 rupees.',
    );
  });

  it('returns nothing for rows that do not exist', () => {
    expect(rowPhrase(readings, 9, true)).toBe('');
  });
});

describe('summaries', () => {
  const document: CovertDocument = {
    id: 'd1',
    title: 'Electricity bill',
    fileType: 'image/jpeg',
    pageCount: 1,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    summary: 'Daily usage for early September.',
    warnings: [],
    tables: [readings],
    ocrText: '',
    stats: computeStats([readings]),
  };

  it('describes the document without reading punctuation or structure', () => {
    expect(summaryPhrase(document)).toBe(
      'Electricity bill. Daily usage for early September. It contains 3 records across 3 columns. 1 value is marked uncertain.',
    );
  });

  it('introduces a table', () => {
    expect(tableIntro(readings)).toBe('Daily readings. 3 rows, 3 columns.');
  });
});

describe('splitForSpeech', () => {
  it('keeps short text as one utterance', () => {
    expect(splitForSpeech('One. Two.')).toEqual(['One. Two.']);
  });

  it('breaks long text at sentence ends', () => {
    const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i}.`).join(' ');
    const chunks = splitForSpeech(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
    expect(chunks.join(' ')).toBe(text);
  });

  it('hard-splits a single sentence longer than the limit', () => {
    const chunks = splitForSpeech('x'.repeat(250), 100);
    expect(chunks.map((chunk) => chunk.length)).toEqual([100, 100, 50]);
  });
});
