import { SiteNav } from '@/components/site-nav';
import { Audio } from '@/components/sections/audio';
import { Demo } from '@/components/sections/demo';
import { DocumentTypes } from '@/components/sections/document-types';
import { FinalCta } from '@/components/sections/final-cta';
import { Hero } from '@/components/sections/hero';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Privacy } from '@/components/sections/privacy';
import { SiteFooter } from '@/components/sections/site-footer';
import { Statement } from '@/components/sections/statement';

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <Demo />
        <HowItWorks />
        <Statement />
        <DocumentTypes />
        <Audio />
        <Privacy />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
