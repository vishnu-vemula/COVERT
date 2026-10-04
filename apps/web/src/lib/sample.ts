/**
 * Illustrative example used in the product visuals: a fictional electricity
 * bill and the table COVERT produces from it. Not customer data.
 */
export const SAMPLE_ROWS = [
  { date: '01 Sep', units: '39', amount: '₹315' },
  { date: '02 Sep', units: '42', amount: '₹339' },
  { date: '03 Sep', units: '38', amount: '₹307' },
  { date: '04 Sep', units: '41', amount: '₹331' },
  { date: '05 Sep', units: '44', amount: '₹356' },
  { date: '06 Sep', units: '36', amount: '₹291' },
  { date: '07 Sep', units: '40', amount: '₹323' },
] as const;

/** Index of the row shown as uncertain (OCR read "3O7"). */
export const UNCERTAIN_ROW = 2;

export const SAMPLE_TITLE = 'Electricity bill — September';
