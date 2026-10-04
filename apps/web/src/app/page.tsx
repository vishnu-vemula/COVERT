import { SiteNav } from '@/components/site-nav';
import { Audio } from '@/components/sections/audio';
import { Demo } from '@/components/sections/demo';
import { DocumentTypes } from '@/components/sections/document-types';
import { Faq } from '@/components/sections/faq';
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
      {/* Clips sideways entrance animations so phones never get a wider page. */}
      <main id="main" className="overflow-x-clip">
        <Hero />
        <Demo />
        <HowItWorks />
        <Statement />
        <DocumentTypes />
        <Audio />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
