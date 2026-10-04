'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';
import { LINKS } from '@/lib/links';

import { ArrowUpRight } from '../button-link';

const STORES = [
  { name: 'App Store', device: 'For iPhone', href: LINKS.appStore },
  { name: 'Google Play', device: 'For Android', href: LINKS.googlePlay },
] as const;

export function FinalCta() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-cta-line]', {
          yPercent: 40,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 1.3,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-cta-title]', start: 'top 80%' },
        });
        gsap.fromTo(
          '[data-circle]',
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: 'power2.inOut',
            delay: 0.6,
            scrollTrigger: { trigger: '[data-cta-title]', start: 'top 80%' },
          },
        );
        gsap.fromTo(
          '[data-cta-script]',
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: root.current, start: 'top 70%' },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="get-covert"
      aria-labelledby="cta-title"
      className="scroll-mt-20 overflow-hidden bg-night pb-3 pt-24 text-paper lg:pt-32">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <p className="max-w-[30ch] text-[12px] font-medium uppercase leading-[1.7] tracking-[0.06em] text-fog sm:text-[13px]">
            COVERT reads invoices, statements, receipts, forms and reports — and hands back a table
            you can use.
          </p>
          <p
            data-cta-script
            aria-hidden
            className="-rotate-6 font-script text-[clamp(2.2rem,5vw,3.6rem)] leading-none text-flare sm:mr-[6%]">
            Take control of your paperwork
          </p>
        </div>

        <h2
          id="cta-title"
          data-cta-title
          className="mt-12 font-condensed text-[clamp(3.4rem,11.5vw,11rem)] uppercase leading-[0.9] tracking-[-0.005em]">
          <span data-cta-line className="block">
            Documents shouldn’t be
          </span>
          <span data-cta-line className="block pt-[0.04em]">
            <span className="relative inline-block px-[0.06em]">
              trapped
              <svg
                aria-hidden
                viewBox="0 0 460 130"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-[8%] -inset-y-[14%] h-[128%] w-[116%] overflow-visible">
                <path
                  data-circle
                  d="M30 66C26 30 160 8 290 14c120 6 170 36 150 66-22 34-140 44-250 40C80 116 6 98 18 62 28 34 110 18 214 12"
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-flare)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={1}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>{' '}
            in documents.
          </span>
        </h2>
      </div>

      <div className="frame mt-16 grid gap-6 rounded-[28px] bg-cobalt p-6 text-white sm:p-10 md:rounded-[36px] lg:mt-24 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow text-white/65">/Get the app</p>
          <h3 className="mt-3 text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1] tracking-[-0.04em]">
            COVERT lives on your phone.
          </h3>
          <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-white/75">
            It’s a mobile app for iPhone and Android. There’s no web version — documents are
            captured, converted and saved in the app, not on this website.
          </p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Download COVERT">
          {STORES.map((store) => (
            <li key={store.name}>
              <a
                href={store.href}
                className="group flex items-center justify-between gap-4 rounded-[22px] bg-white px-5 py-4 text-ink transition-colors duration-300 hover:bg-paper">
                <span>
                  <span className="block text-[13px] text-ink/60">{store.device}</span>
                  <span className="block text-[20px] font-semibold tracking-[-0.02em]">
                    {store.name}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-cobalt text-white transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                  <ArrowUpRight className="size-5" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
