'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';
import { LINKS } from '@/lib/links';

import { ArrowBadge, ButtonLink } from '../button-link';
import { Logo } from '../logo';

const NAV = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#documents', label: 'Documents' },
  { href: '#privacy', label: 'Privacy' },
] as const;

const LEGAL = [
  { href: LINKS.privacy, label: 'Privacy' },
  { href: LINKS.terms, label: 'Terms' },
  { href: LINKS.github, label: 'GitHub' },
] as const;

export function SiteFooter() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-glyph]', {
          y: 240,
          stagger: 0.06,
          duration: 1.3,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="frame mb-2 mt-2 rounded-[28px] bg-night-2 text-paper md:mb-3 md:mt-3 md:rounded-[36px]">
      <div className="grid gap-12 px-6 pb-6 pt-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-10 lg:pt-16">
        <div className="flex flex-col justify-between gap-10">
          <p className="eyebrow text-fog">Capture · OCR · Validate · Extract · Read · Tabulate</p>
          <Logo className="h-auto w-full max-w-[900px] text-paper/15" />
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-[auto_auto] lg:grid-cols-1 lg:content-between">
          <nav aria-label="Footer">
            <ul className="grid gap-2.5">
              {NAV.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[16px] font-medium text-paper/85 transition-colors hover:text-flare">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-[14px] text-fog">Questions or ideas?</p>
            <ButtonLink href={`${LINKS.github}/issues`} variant="paper" size="md" className="mt-3">
              Open an issue
              <ArrowBadge size="md" className="bg-night text-paper" />
            </ButtonLink>
          </div>
        </div>
      </div>
      <div className="mx-6 flex flex-col gap-4 border-t border-white/10 py-6 text-[13px] text-fog sm:mx-8 sm:flex-row sm:items-center sm:justify-between lg:mx-10">
        <p>COVERT · Documents in. Structured data out.</p>
        <ul className="flex gap-6">
          {LEGAL.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="transition-colors hover:text-paper">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
