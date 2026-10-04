import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { Anton, Mrs_Saint_Delafield } from 'next/font/google';
import type { ReactNode } from 'react';

import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ShapeDefs } from '@/components/ui/shape';
import { FAQS, SITE } from '@/lib/site';

import './globals.css';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' });
const script = Mrs_Saint_Delafield({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-script-face',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  category: 'productivity',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE.name,
    locale: 'en_US',
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0a',
  colorScheme: 'dark',
};

/** Structured data: the product is a mobile app; this site is its landing page. */
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MobileApplication',
      '@id': `${SITE.url}/#app`,
      name: SITE.name,
      description: SITE.description,
      operatingSystem: SITE.platforms.join(', '),
      applicationCategory: 'BusinessApplication',
      url: SITE.url,
      featureList: [
        'Capture documents with the camera',
        'Import JPG, PNG and PDF files',
        'OCR text recognition',
        'Structured table extraction',
        'Flags uncertain values for review',
        'Edit cells, copy tables and export CSV',
        'Read summaries and tables aloud',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: `Landing page for the ${SITE.name} mobile app.`,
      about: { '@id': `${SITE.url}/#app` },
      inLanguage: 'en',
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE.url}/#faq`,
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${anton.variable} ${script.variable}`}>
      <head>
        {/* Lets CSS hide intro elements only when the animation can run. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <ShapeDefs />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
