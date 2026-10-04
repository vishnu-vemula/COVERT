/**
 * Rewrites a table value so device text-to-speech says it the way a person
 * would: currencies after amounts, month names in full, no punctuation read
 * aloud. Digits are left to the speech engine, which handles them well.
 */

const CURRENCIES: [RegExp, string, string][] = [
  [/^(?:₹|rs\.?|inr)\s*/i, 'rupee', 'rupees'],
  [/^(?:\$|usd)\s*/i, 'dollar', 'dollars'],
  [/^(?:€|eur)\s*/i, 'euro', 'euros'],
  [/^(?:£|gbp)\s*/i, 'pound', 'pounds'],
  [/^(?:¥|jpy)\s*/i, 'yen', 'yen'],
];

const MONTHS: Record<string, string> = {
  jan: 'January',
  feb: 'February',
  mar: 'March',
  apr: 'April',
  may: 'May',
  jun: 'June',
  jul: 'July',
  aug: 'August',
  sep: 'September',
  sept: 'September',
  oct: 'October',
  nov: 'November',
  dec: 'December',
};

const MONTH_NAMES = [...new Set(Object.values(MONTHS))];
const MONTH_PATTERN = [...Object.keys(MONTHS), ...MONTH_NAMES].join('|');

export const BLANK = 'blank';

export function speakableValue(raw: string): string {
  let value = raw.replace(/\s+/g, ' ').trim();
  if (!/[\p{L}\p{N}]/u.test(value)) return BLANK;

  value = speakDate(value) ?? speakCurrency(value) ?? value;

  return value
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/(\p{L})\/(?=\p{L})/gu, '$1 ')
    .replace(/[|_*#~•·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Applies the same currency and percent wording inside sentences (summaries, titles). */
export function speakableProse(text: string): string {
  return text
    .replace(/(?:₹|\$|€|£|¥|\b(?:rs\.?|inr|usd|eur|gbp)\s?)\s?\d[\d,]*(?:\.\d+)?/gi, (match) => {
      return speakCurrency(match.trim()) ?? match;
    })
    .replace(/(\d)\s*%/g, '$1 percent');
}

function speakCurrency(value: string): string | null {
  const negative = /^[-−]/.test(value) || /^\(.*\)$/.test(value);
  const unsigned = value.replace(/^[-−]\s*/, '').replace(/^\((.*)\)$/, '$1');
  for (const [pattern, singular, plural] of CURRENCIES) {
    if (!pattern.test(unsigned)) continue;
    const amount = unsigned.replace(pattern, '').trim();
    if (!/^[\d.,\s]+$/.test(amount)) return null;
    const unit = /^0*1(?:\.0+)?$/.test(amount.replace(/[,\s]/g, '')) ? singular : plural;
    return `${negative ? 'minus ' : ''}${amount} ${unit}`;
  }
  return null;
}

/** "04 Sep", "04-Sep-2024", "Sep 4, 2024" and ISO dates become "September 4" style. */
function speakDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    const name = MONTH_NAMES[Number(iso[2]) - 1];
    return name ? formatDate(name, iso[3] ?? '', iso[1]) : null;
  }

  const dayFirst = new RegExp(
    `^(\\d{1,2})[\\s-]+(${MONTH_PATTERN})\\.?(?:[\\s-]+(\\d{2,4}))?$`,
    'i',
  ).exec(value);
  if (dayFirst) return formatDate(dayFirst[2] ?? '', dayFirst[1] ?? '', dayFirst[3]);

  const monthFirst = new RegExp(
    `^(${MONTH_PATTERN})\\.?\\s+(\\d{1,2}),?(?:\\s+(\\d{4}))?$`,
    'i',
  ).exec(value);
  if (monthFirst) return formatDate(monthFirst[1] ?? '', monthFirst[2] ?? '', monthFirst[3]);

  const monthOnly = new RegExp(`^(${MONTH_PATTERN})\\.?$`, 'i').exec(value);
  if (monthOnly) return formatMonth(monthOnly[1] ?? '');

  return null;
}

function formatDate(month: string, day: string, year: string | undefined): string | null {
  const name = formatMonth(month);
  const dayNumber = Number(day);
  if (!name || dayNumber < 1 || dayNumber > 31) return null;
  return year ? `${name} ${dayNumber}, ${year}` : `${name} ${dayNumber}`;
}

function formatMonth(month: string): string | null {
  const key = month.toLowerCase();
  return MONTHS[key] ?? MONTH_NAMES.find((full) => full.toLowerCase() === key) ?? null;
}
