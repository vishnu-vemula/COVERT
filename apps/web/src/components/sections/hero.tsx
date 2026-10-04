'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';
import { LINKS } from '@/lib/links';

import { ArrowBadge, ArrowUpRight, ButtonLink } from '../button-link';
import { Logo } from '../logo';
import { PhoneDemo } from '../phone-demo';
import { Shape } from '../ui/shape';

const FEATURES = [
  { label: 'Scan with the camera', tag: 'Capture' },
  { label: 'Import photos and PDFs', tag: 'JPG · PNG · PDF' },
  { label: 'Flags values it isn’t sure about', tag: 'Validate' },
  { label: 'Read aloud, edit, export to CSV', tag: 'Use' },
] as const;

const HEADLINE = ['Documents in.', 'Structured', 'data out.'] as const;

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION.motion, () => {
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
        intro
          .set('[data-hero-logo]', { autoAlpha: 1 })
          .from(
            '[data-glyph]',
            { y: 260, rotate: 10, transformOrigin: '0% 100%', duration: 1.4, stagger: 0.07 },
            0,
          )
          .from('[data-hero-meta]', { autoAlpha: 0, y: 12, duration: 1 }, 0.3)
          .from('[data-hero-card]', { y: 80, autoAlpha: 0, duration: 1.3, stagger: 0.12 }, 0.35)
          .from('[data-hero-line]', { yPercent: 110, duration: 1.2, stagger: 0.08 }, 0.6)
          .from(
            '[data-hero-shape]',
            { scale: 0.3, rotate: -60, autoAlpha: 0, duration: 1.6, stagger: 0.1 },
            0.55,
          )
          .from('[data-hero-pill]', { x: 40, autoAlpha: 0, duration: 1, stagger: 0.07 }, 0.75)
          .from('[data-hero-fade]', { y: 16, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.95)
          .from('[data-hero-phone]', { y: 220, duration: 1.6 }, 0.7);

        // Leaving the hero: shapes spin away, the phone rises out of its card.
        const scroll = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.8 };
        gsap.to('[data-hero-spin]', { rotate: 90, yPercent: -18, scrollTrigger: scroll });
        gsap.to('[data-hero-rise]', { yPercent: -16, scrollTrigger: scroll });
      });

      // Letters lift toward the pointer.
      mm.add(`${MOTION.motion} and (hover: hover)`, () => {
        const wrap = root.current?.querySelector<HTMLElement>('[data-hero-logo]');
        if (!wrap) return;
        const letters = gsap.utils.toArray<SVGGElement>('[data-letter]', wrap);
        const lifts = letters.map((letter) =>
          gsap.quickTo(letter, 'y', { duration: 0.6, ease: 'power3.out' }),
        );
        const move = (event: PointerEvent) => {
          letters.forEach((letter, index) => {
            const box = letter.getBoundingClientRect();
            const distance = Math.abs(event.clientX - (box.left + box.width / 2));
            lifts[index]?.(-Math.max(0, 1 - distance / (box.width * 1.6)) * 22);
          });
        };
        const leave = () => lifts.forEach((lift) => lift(0));
        wrap.addEventListener('pointermove', move);
        wrap.addEventListener('pointerleave', leave);
        return () => {
          wrap.removeEventListener('pointermove', move);
          wrap.removeEventListener('pointerleave', leave);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      aria-labelledby="hero-title"
      className="frame mt-2 rounded-[28px] bg-paper p-2 pt-[76px] md:mt-3 md:rounded-[36px] md:p-3 md:pt-[88px]">
      <div
        data-hero-meta
        data-intro
        className="eyebrow flex justify-between gap-4 px-2 pb-3 text-ink/55 md:px-3">
        <span>Capture · OCR · Validate · Extract · Read · Tabulate</span>
        <span className="hidden sm:block">For iPhone and Android</span>
      </div>

      <div data-hero-logo data-intro className="px-1 py-1 md:px-2">
        <Logo className="h-auto w-full text-ink" />
      </div>

      <div className="mt-3 grid gap-2 md:mt-4 lg:grid-cols-[1.35fr_1fr]">
        <div
          data-hero-card
          data-intro
          className="relative flex min-h-[500px] flex-col justify-end overflow-hidden rounded-[22px] bg-cobalt p-6 text-white sm:p-8 lg:min-h-[540px] lg:rounded-[28px] lg:p-10">
          <div data-hero-spin className="absolute -right-20 -top-24 size-[260px] sm:size-[340px]">
            <div data-hero-shape className="size-full">
              <Shape kind="clover" className="size-full" />
            </div>
          </div>
          <div
            data-hero-spin
            className="absolute right-[44%] top-8 hidden size-20 sm:block lg:right-[52%] lg:size-24">
            <div data-hero-shape className="size-full">
              <Shape kind="ring" tone="chrome" className="size-full" />
            </div>
          </div>

          <h1
            id="hero-title"
            className="relative max-w-[11ch] text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
            {HEADLINE.map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span data-hero-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p
            data-hero-fade
            className="relative mt-6 max-w-[36ch] text-[17px] leading-[1.5] text-white/75 sm:text-[19px]">
            Turn images and documents into organized tables you can review, hear, edit and export.
          </p>
          <div data-hero-fade className="relative mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href={LINKS.getApp} variant="paper">
              Get COVERT
              <ArrowBadge className="bg-cobalt text-white" />
            </ButtonLink>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center rounded-full px-5 text-[16px] font-semibold text-white ring-1 ring-white/35 transition-[box-shadow,background-color] hover:bg-white/10 hover:ring-white">
              See how it works
            </a>
          </div>
        </div>

        <div
          data-hero-card
          data-intro
          className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[22px] bg-paper-2 p-2 lg:min-h-[540px] lg:rounded-[28px] lg:p-3">
          <ul className="relative z-10 grid gap-1.5">
            {FEATURES.map((feature) => (
              <li
                key={feature.label}
                data-hero-pill
                className="flex items-center gap-3 rounded-full bg-paper/80 py-3 pl-3 pr-4 text-[15px] font-medium backdrop-blur-sm">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-paper">
                  <ArrowUpRight className="size-3.5" />
                </span>
                <span className="flex-1">{feature.label}</span>
                <span className="eyebrow hidden text-[11px] text-ink/50 sm:block">
                  {feature.tag}
                </span>
              </li>
            ))}
          </ul>

          <div
            data-hero-spin
            aria-hidden
            className="absolute -bottom-16 -right-14 size-[260px] opacity-90">
            <Shape kind="flower" tone="pearl" className="size-full" />
          </div>
          <div data-hero-rise className="relative mt-6 flex flex-1 justify-center">
            <div data-hero-phone className="absolute top-0 w-[270px] sm:w-[300px]">
              <PhoneDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
