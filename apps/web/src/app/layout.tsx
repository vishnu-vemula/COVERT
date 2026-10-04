import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { Anton, Mrs_Saint_Delafield } from 'next/font/google';
import type { ReactNode } from 'react';

import { ShapeDefs } from '@/components/ui/shape';
import { SmoothScroll } from '@/components/motion/smooth-scroll';

import './globals.css';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' });
const script = Mrs_Saint_Delafield({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-script-face',
});

export const metadata: Metadata = {
  title: 'COVERT — Documents in. Structured data out.',
  description:
    'Turn images and documents into organized tables you can review, hear, edit and export.',
  applicationName: 'COVERT',
  openGraph: {
    title: 'COVERT — Documents in. Structured data out.',
    description:
      'Turn images and documents into organized tables you can review, hear, edit and export.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${anton.variable} ${script.variable}`}>
      <head>
        {/* Lets CSS hide intro elements only when the animation can run. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
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
