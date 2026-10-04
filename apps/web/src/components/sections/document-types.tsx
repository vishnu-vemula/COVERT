'use client';

import { useRef } from 'react';

import { gsap, MOTION, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { LINKS } from '@/lib/links';

import { ArrowBadge, ButtonLink } from '../button-link';
import { Shape, type ShapeKind, type ShapeTone } from '../ui/shape';

interface DocType {
  title: string;
  tag: string;
  card: string;
  shape?: { kind: ShapeKind; tone: ShapeTone };
}

const TYPES: DocType[] = [
  { title: 'Invoices', tag: 'Line items', card: 'bg-cobalt text-white', shape: { kind: 'clover', tone: 'pearl' } },
  { title: 'Statements', tag: 'Transactions', card: 'bg-white' },
  { title: 'Receipts', tag: 'Prices and totals', card: 'bg-white', shape: { kind: 'ring', tone: 'cobalt' } },
  { title: 'Forms', tag: 'Labelled fields', card: 'bg-night-3 text-paper', shape: { kind: 'bolt', tone: 'chrome' } },
  { title: 'Schedules', tag: 'Dates and times', card: 'bg-cobalt text-white' },
  { title: 'Reports', tag: 'Several tables', card: 'bg-white', shape: { kind: 'flower', tone: 'cobalt' } },
];

const MARQUEE = ['Invoices', 'Statements', 'Receipts', 'Forms', 'Schedules', 'Reports', 'Lists'];

export function DocumentTypes() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        // Endless ticker that speeds up, and turns around, with the scroll.
        const loop = gsap.to('[data-marquee]', {
          xPercent: -50,
          duration: 28,
          ease: 'none',
          repeat: -1,
        });
        // Start deep into the repeats so scrolling up can run it backwards.
        loop.totalTime(loop.duration() * 500);
        let settle: gsap.core.Tween | undefined;
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const boost = Math.min(Math.abs(self.getVelocity()) / 250, 6);
            loop.timeScale((1 + boost) * self.direction);
            settle?.kill();
            settle = gsap.to(loop, { timeScale: self.direction, duration: 1.2, ease: 'power2.out' });
          },
        });

        gsap.from('[data-type-card]', {
          y: 70,
          autoAlpha: 0,
          rotate: (index: number) => (index % 2 ? 2 : -2),
          stagger: 0.07,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-type-grid]', start: 'top 82%' },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="documents"
      aria-labelledby="types-title"
      className="frame mt-2 scroll-mt-20 overflow-hidden rounded-[28px] bg-paper p-2 md:mt-3 md:rounded-[36px] md:p-3">
      <div className="px-3 pb-8 pt-14 text-center md:pt-20">
        <p className="eyebrow text-ink/55">/Documents</p>
        <h2
          id="types-title"
          className="mx-auto mt-3 max-w-[18ch] text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1] tracking-[-0.045em]">
          Messy input. Predictable output.
        </h2>
      </div>

      <div aria-hidden className="-mx-2 overflow-hidden py-4 md:-mx-3">
        <div data-marquee className="flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {MARQUEE.map((word) => (
                <span
                  key={word}
                  className="flex items-center font-condensed text-[clamp(3.5rem,9vw,8.5rem)] uppercase leading-none">
                  <span className="px-5 md:px-8">{word}</span>
                  <Shape kind="flower" tone="cobalt" className="size-[0.42em] shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <ul data-type-grid className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((type, index) => (
          <li
            key={type.title}
            data-type-card
            className={`group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[22px] p-4 lg:min-h-[290px] lg:rounded-[26px] ${type.card}`}>
            {type.shape ? (
              <div
                aria-hidden
                className="absolute -right-8 -top-6 size-44 transition-transform duration-700 ease-out-expo group-hover:-rotate-[25deg] group-hover:scale-110 lg:size-52">
                <Shape kind={type.shape.kind} tone={type.shape.tone} className="size-full" />
              </div>
            ) : null}
            <div className="relative flex items-start justify-between gap-3">
              <span className="rounded-full px-3 py-1 text-[12px] font-medium ring-1 ring-current/30">
                {type.tag}
              </span>
              {type.shape ? null : (
                <span className="eyebrow tabular opacity-60">0{index + 1}</span>
              )}
            </div>
            <div className="relative">
              <h3 className="text-[clamp(1.6rem,2.4vw,2rem)] font-semibold leading-none tracking-[-0.035em]">
                {type.title}
              </h3>
              <p className="mt-2 text-[14px] opacity-65">JPG · PNG · PDF</p>
            </div>
          </li>
        ))}
        <li
          data-type-card
          className="relative flex min-h-[250px] flex-col justify-between gap-8 overflow-hidden rounded-[22px] bg-night p-6 text-paper sm:col-span-2 lg:min-h-[290px] lg:rounded-[26px] lg:p-8">
          <p className="max-w-[26ch] text-[clamp(1.4rem,2.4vw,2rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Lists, logs, price sheets and more. If it’s laid out in rows, COVERT can find them.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[34ch] text-[15px] leading-[1.5] text-fog">
              Grids, line items, labelled forms and plain lists — even several tables on one page.
            </p>
            <ButtonLink href={LINKS.getApp} variant="cobalt" size="md">
              Get COVERT
              <ArrowBadge size="md" className="bg-white text-cobalt" />
            </ButtonLink>
          </div>
        </li>
      </ul>
    </section>
  );
}
