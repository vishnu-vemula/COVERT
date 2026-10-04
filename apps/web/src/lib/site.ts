/**
 * Site-wide facts used for metadata, structured data and the social image.
 * This website is only the landing page; COVERT itself is a mobile app.
 */

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

export const SITE = {
  name: 'COVERT',
  /** Set NEXT_PUBLIC_SITE_URL to the production domain before deploying. */
  url: resolveSiteUrl(),
  title: 'COVERT — Mobile app that turns documents into editable tables',
  tagline: 'Documents in. Structured data out.',
  description:
    'COVERT is a mobile app for iPhone and Android that turns photos, scans and PDFs of invoices, receipts, statements and forms into editable tables. Review flagged values, listen with text-to-speech and export to CSV.',
  keywords: [
    'document to table app',
    'OCR app',
    'scan to spreadsheet',
    'receipt scanner app',
    'invoice scanner',
    'PDF to CSV',
    'image to table',
    'table extraction',
    'text to speech tables',
    'iPhone app',
    'Android app',
  ],
  platforms: ['iOS', 'Android'],
} as const;

export const FAQS = [
  {
    question: 'Is COVERT a website or an app?',
    answer:
      'COVERT is a mobile app for iPhone and Android. This website is only its landing page — you can’t upload or convert documents here. Install the app to capture documents, turn them into tables and keep your history.',
  },
  {
    question: 'What kinds of documents can COVERT read?',
    answer:
      'Photos and scans saved as JPG or PNG, and PDFs — invoices, statements, receipts, forms, schedules and reports. If the information is laid out in rows, COVERT can turn it into a table, even when a page holds several tables.',
  },
  {
    question: 'How accurate are the tables?',
    answer:
      'Values, order and currencies are kept exactly as printed, and COVERT is instructed never to invent a value that isn’t on the page. Anything it isn’t sure about is flagged so you can check it before you export.',
  },
  {
    question: 'Can I edit and export the results?',
    answer:
      'Yes. Edit any cell in the app, copy the table, or export it as a CSV file to open in your spreadsheet.',
  },
  {
    question: 'Can COVERT read my tables aloud?',
    answer:
      'Yes. Using your phone’s text-to-speech, COVERT reads a summary or the whole table row by row, at speeds from 0.75× to 2×, with or without column names.',
  },
  {
    question: 'Does COVERT keep my original documents?',
    answer:
      'No. Photos and PDFs are processed in memory and discarded once converted. Your saved tables belong to your account, and you can delete one or clear your whole history at any time.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'Yes. You sign in to the app with an email and password so your saved tables stay private to you. You can reset your password from the sign-in screen.',
  },
] as const;
