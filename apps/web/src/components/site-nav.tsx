'use client';

import { useRef } from 'react';

import { gsap, MOTION, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { LINKS } from '@/lib/links';

import { ArrowBadge, ButtonLink } from './button-link';
import { Logo } from './logo';

const ITEMS = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#privacy', label: 'Privacy' },
] as const;

/** Floating dark nav bar. Slides away while scrolling down, returns on the way up. */
export function SiteNav() {
  const bar = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('nav', { yPercent: -160, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: 0.9 });
        const hide = gsap.to(bar.current, {
          yPercent: -160,
          duration: 0.45,
          ease: 'power3.inOut',
          paused: true,
        });
        ScrollTrigger.create({
          start: 'top top-=240',
          end: 'max',
          onUpdate: (self) => (self.direction === 1 ? hide.play() : hide.reverse()),
          onLeaveBack: () => hide.reverse(),
        });
      });
      return () => mm.revert();
    },
    { scope: bar },
  );

  return (
    <header ref={bar} className="fixed inset-x-0 top-2 z-50 px-2 md:top-3 md:px-3">
      <nav
        aria-label="Main"
        data-intro
        className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 rounded-full bg-night/90 pl-5 pr-2 text-paper shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-md md:grid md:grid-cols-[1fr_auto_1fr] md:pl-3">
        <ul className="hidden items-center gap-1 md:flex">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-full px-3.5 py-2 text-[14px] font-medium text-fog transition-colors hover:bg-white/10 hover:text-paper">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#top" aria-label="COVERT, back to top" className="justify-self-center">
          <Logo label={null} className="h-[18px] w-auto md:h-5" />
        </a>
        <div className="flex items-center justify-end gap-2">
          <a
            href={LINKS.github}
            className="hidden h-10 items-center rounded-full px-3.5 text-[14px] font-medium text-fog transition-colors hover:bg-white/10 hover:text-paper sm:inline-flex">
            GitHub
          </a>
          <ButtonLink href={LINKS.getApp} variant="paper" size="md">
            Get the app
            <ArrowBadge size="md" className="bg-night text-paper" />
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}
