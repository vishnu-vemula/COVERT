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
          .from(
            '[data-hero-shape]',
            { scale: 0.3, rotate: -60, autoAlpha: 0, duration: 1.6, stagger: 0.1 },
            0.55,
          )
          .from('[data-hero-pill]', { x: 40, autoAlpha: 0, duration: 1, stagger: 0.07 }, 0.45)
          .from('[data-hero-phone]', { y: 220, autoAlpha: 0, duration: 1.6 }, 0.4);

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
      className="frame mt-2 rounded-[28px] bg-paper p-2 pt-[80px] md:mt-3 md:rounded-[36px] md:p-3 md:pt-[92px]">
      <div
        data-hero-meta
        data-intro
        className="eyebrow flex justify-between gap-4 px-2 pb-3 text-ink/55 md:px-3">
        <span>Capture · OCR · Validate · Extract · Read · Tabulate</span>
        <span className="hidden sm:block">Mobile app · iPhone &amp; Android</span>
      </div>

      <div data-hero-logo data-intro className="px-1 py-1 md:px-2">
        <Logo className="h-auto w-full text-ink" />
      </div>

      <div className="mt-3 grid gap-2 md:mt-4 lg:grid-cols-[1.35fr_1fr]">
        {/* The cards rise with CSS so the headline paints at once (good for LCP). */}
        <div className="hero-rise relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-[22px] bg-cobalt p-6 text-white sm:p-8 lg:min-h-[500px] lg:rounded-[28px] lg:p-10">
          <div data-hero-spin className="absolute -right-20 -top-24 size-[260px] sm:size-[340px]">
            <div data-hero-shape data-intro className="size-full">
              <Shape kind="clover" className="size-full" />
            </div>
          </div>
          <div data-hero-spin className="absolute right-[40%] top-6 hidden size-20 sm:block">
            <div data-hero-shape data-intro className="size-full">
              <Shape kind="ring" tone="chrome" className="size-full" />
            </div>
          </div>

          <p className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/12 py-1.5 pl-2 pr-3.5 text-[13px] font-semibold ring-1 ring-white/25 backdrop-blur-sm sm:left-8 sm:top-8 lg:left-10 lg:top-10">
            <PhoneGlyph />
            Mobile app for iPhone &amp; Android
          </p>

          <h1
            id="hero-title"
            className="relative mt-24 max-w-[11ch] text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
            {HEADLINE.map((line) => (
              <span key={line} className="block pb-[0.06em]">
                {line}
              </span>
            ))}
          </h1>
          <p className="relative mt-6 max-w-[38ch] text-[17px] leading-[1.5] text-white/80 sm:text-[19px]">
            COVERT is a mobile app that turns photos, scans and PDFs into organized tables you can
            review, hear, edit and export.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href={LINKS.getApp} variant="paper">
              Get the app
              <ArrowBadge className="bg-cobalt text-white" />
            </ButtonLink>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center rounded-full px-5 text-[16px] font-semibold text-white ring-1 ring-white/35 transition-[box-shadow,background-color] hover:bg-white/10 hover:ring-white">
              See how it works
            </a>
          </div>
          <p className="relative mt-5 text-[13px] text-white/60">
            This website is just the landing page — COVERT runs on your phone.
          </p>
        </div>

        <div
          style={{ animationDelay: '120ms' }}
          className="hero-rise relative flex min-h-[520px] flex-col overflow-hidden rounded-[22px] bg-paper-2 p-2 lg:min-h-[500px] lg:rounded-[28px] lg:p-3">
          <ul className="relative z-10 grid gap-1.5">
            {FEATURES.map((feature) => (
              <li
                key={feature.label}
                data-hero-pill
                data-intro
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
            <div data-hero-phone data-intro className="absolute top-0 w-[270px] sm:w-[300px]">
              <PhoneDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}
