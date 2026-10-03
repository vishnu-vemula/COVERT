const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Spells out whole numbers up to 999,999 ("forty-one", "three hundred thirty-one"). */
export function numberToWords(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 999_999) return String(value);
  if (value < 20) return ONES[value] ?? String(value);
  if (value < 100) {
    const tens = TENS[Math.floor(value / 10)] ?? '';
    const ones = value % 10;
    return ones ? `${tens}-${ONES[ones]}` : tens;
  }
  if (value < 1000) {
    const rest = value % 100;
    const head = `${ONES[Math.floor(value / 100)]} hundred`;
    return rest ? `${head} ${numberToWords(rest)}` : head;
  }
  const rest = value % 1000;
  const head = `${numberToWords(Math.floor(value / 1000))} thousand`;
  return rest ? `${head} ${numberToWords(rest)}` : head;
}
