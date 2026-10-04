'use client';

import { useRef } from 'react';

import { DESKTOP_MOTION, gsap, MOTION, useGSAP } from '@/lib/gsap';
import { SAMPLE_ROWS, UNCERTAIN_ROW } from '@/lib/sample';

import { Shape } from '../ui/shape';

const STEPS = [
  { title: 'Capture', copy: 'Scan with the camera, or import a JPG, PNG or PDF.' },
  { title: 'Read', copy: 'Google Cloud Vision recognizes the text, and COVERT tidies it up.' },
  {
    title: 'Structure',
    copy: 'Columns, rows, separate tables and a short summary are pulled out — nothing is invented.',
  },
  {
    title: 'Validate',
    copy: 'Every result is checked against a strict schema. Values COVERT isn’t sure about are flagged.',
  },
  { title: 'Use', copy: 'Review, listen, edit, copy or export the table as CSV.' },
] as const;

const DOC_LINES = 7;

/**
 * The pipeline, step by step. On large screens the section pins while the
 * visual builds up one stage per step; elsewhere it plays through once.
 */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>('[data-step]');
      const setActive = (active: number) =>
        steps.forEach((step, index) => step.toggleAttribute('data-active', index === active));

      const build = () =>
        gsap
          .timeline({ defaults: { ease: 'power3.out', duration: 1 } })
          .addLabel('capture')
          .from('[data-doc]', { y: 60, rotate: -10, autoAlpha: 0 })
          .from('[data-corner]', { scale: 1.6, autoAlpha: 0, stagger: 0.05 }, '<0.3')
          .addLabel('read')
          .fromTo(
            '[data-scan]',
            { top: '0%', autoAlpha: 1 },
            { top: '100%', ease: 'none', duration: 1.4 },
          )
          .from('[data-doc-line]', { backgroundColor: '#d3d0c6', stagger: 0.14 }, '<')
          .to('[data-scan]', { autoAlpha: 0, duration: 0.2 })
          .addLabel('structure')
          .from('[data-table]', { x: 120, y: 40, rotate: 6, autoAlpha: 0, duration: 1.2 })
          .from('[data-table-row]', { autoAlpha: 0, x: 20, stagger: 0.08 }, '<0.4')
          .addLabel('validate')
          .from('[data-check]', { y: -20, autoAlpha: 0, duration: 0.8 })
          .from('[data-uncertain]', { backgroundColor: 'rgba(248,237,203,0)', duration: 0.6 }, '<')
          .from('[data-uncertain-dot]', { scale: 0, ease: 'back.out(3)', duration: 0.6 }, '<0.2')
          .addLabel('use')
          .from('[data-chip]', { y: 40, autoAlpha: 0, stagger: 0.1, ease: 'back.out(1.6)' });

      const mm = gsap.matchMedia();

      mm.add(DESKTOP_MOTION, () => {
        const timeline = build().pause();
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '[data-how-stage]',
              start: 'center center',
              end: '+=240%',
              pin: true,
              scrub: 0.7,
              onUpdate: (self) =>
                setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))),
            },
          })
          .to(timeline, { progress: 1, ease: 'none' });
        setActive(0);
        return () => setActive(-1);
      });

      mm.add(`(max-width: 1023.98px) and ${MOTION.motion}`, () => {
        const timeline = build().pause();
        gsap
          .timeline({ scrollTrigger: { trigger: '[data-visual]', start: 'top 70%' } })
          .to(timeline, { progress: 1, duration: 4, ease: 'power1.inOut' });
        gsap.from(steps, {
          autoAlpha: 0,
          y: 30,
          stagger: 0.08,
          scrollTrigger: { trigger: '[data-steps]', start: 'top 80%' },
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="how-it-works"
      aria-labelledby="how-title"
      className="frame scroll-mt-20 rounded-[28px] bg-paper p-2 md:rounded-[36px] md:p-3">
      <div className="px-3 pb-10 pt-14 text-center md:pb-14 md:pt-20">
        <p className="eyebrow text-ink/55">/How it works</p>
        <h2
          id="how-title"
          className="mx-auto mt-3 max-w-[16ch] text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1] tracking-[-0.045em]">
          From paper to a table in five steps
        </h2>
      </div>

      <div data-how-stage className="grid gap-2 lg:grid-cols-[1.1fr_1fr]">
        <Visual />
        <ol data-steps className="grid content-start gap-2 lg:content-center">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-step
              className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-2 rounded-[22px] bg-paper-2 px-5 py-5 transition-colors duration-500 data-[active]:bg-night data-[active]:text-paper sm:px-6 lg:rounded-[26px]">
              <span className="eyebrow text-ink/50 transition-colors duration-500 group-data-[active]:text-flare">
                /{index + 1}
              </span>
              <span>
                <span className="block text-[22px] font-semibold tracking-[-0.025em] sm:text-[24px]">
                  {step.title}
                </span>
                <span className="mt-1 block text-[15px] leading-[1.5] text-ink/65 transition-colors duration-500 group-data-[active]:text-paper/70 sm:text-[16px]">
                  {step.copy}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A document being captured, read, structured, checked and put to use. */
function Visual() {
  return (
    <div
      data-visual
      role="img"
      aria-label="A bill being scanned and turned into a checked table, ready to read aloud, edit or export."
      className="relative min-h-[520px] overflow-hidden rounded-[22px] bg-cobalt lg:h-[min(76vh,640px)] lg:min-h-0 lg:rounded-[28px]">
      <div aria-hidden className="absolute -bottom-24 -left-20 size-72 opacity-90">
        <Shape kind="flower" className="size-full" />
      </div>
      <div aria-hidden className="absolute right-6 top-6 size-24">
        <Shape kind="bolt" tone="chrome" className="size-full" />
      </div>

      <div aria-hidden className="absolute inset-0 grid place-items-center p-6">
        <div className="relative w-[min(78%,340px)] -translate-x-[14%] -translate-y-[8%]">
          {/* Captured page */}
          <div data-doc className="relative -rotate-3 rounded-[10px] bg-[#f6f3ea] p-5 shadow-2xl">
            <div className="mx-auto h-2.5 w-1/2 rounded-full bg-ink/80" />
            <div className="mx-auto mt-2 h-1.5 w-1/3 rounded-full bg-ink/30" />
            <div className="mt-5 grid gap-2.5">
              {Array.from({ length: DOC_LINES }, (_, index) => (
                <div key={index} className="grid grid-cols-[1fr_0.5fr_0.7fr] gap-3">
                  <span data-doc-line className="h-2 rounded-full bg-cobalt-soft/70" />
                  <span data-doc-line className="h-2 rounded-full bg-cobalt-soft/70" />
                  <span data-doc-line className="h-2 rounded-full bg-cobalt-soft/70" />
                </div>
              ))}
            </div>
            <div
              data-scan
              className="invisible absolute inset-x-[-6%] top-0 h-[3px] rounded-full bg-flare shadow-[0_0_18px_4px_rgba(255,79,31,0.6)]"
            />
            {[
              '-left-3 -top-3 border-l-4 border-t-4',
              '-right-3 -top-3 border-r-4 border-t-4',
              '-bottom-3 -left-3 border-b-4 border-l-4',
              '-bottom-3 -right-3 border-b-4 border-r-4',
            ].map((corner) => (
              <span
                key={corner}
                data-corner
                className={`absolute size-8 rounded-[6px] border-white ${corner}`}
              />
            ))}
          </div>

          {/* Structured table */}
          <div
            data-table
            className="absolute -bottom-[38%] -right-[16%] w-[92%] sm:-bottom-[34%] sm:-right-[42%] rounded-[20px] bg-paper p-2 text-ink shadow-[0_30px_50px_-20px_rgba(0,0,0,0.5)]">
            <div
              data-check
              className="absolute -top-4 right-4 flex items-center gap-1.5 rounded-full bg-night px-3 py-1.5 text-[11px] font-semibold text-paper">
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 text-flare"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="m5 12 5 5 9-10" />
              </svg>
              Schema checked
            </div>
            <div className="grid grid-cols-[1.2fr_0.8fr_1fr] rounded-[12px] bg-paper-2 px-3 py-2 text-[11px] font-bold">
              <span>Date</span>
              <span className="text-right">Units</span>
              <span className="text-right">Amount</span>
            </div>
            {SAMPLE_ROWS.slice(0, 4).map((row, index) => (
              <div
                key={row.date}
                data-table-row
                className="grid grid-cols-[1.2fr_0.8fr_1fr] border-b border-paper-3 px-3 py-1.5 text-[12px] tabular last:border-0">
                <span>{row.date}</span>
                <span className="text-right">{row.units}</span>
                <span className="text-right">
                  {index === UNCERTAIN_ROW ? (
                    <span data-uncertain className="relative rounded-[4px] bg-review-wash px-1">
                      {row.amount}
                      <span
                        data-uncertain-dot
                        className="absolute -right-1 -top-1 size-1.5 rounded-full bg-review"
                      />
                    </span>
                  ) : (
                    row.amount
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What you can do with it */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-5 flex flex-wrap justify-center gap-2 px-4">
        {['Read aloud', 'Edit', 'Copy', 'Export CSV'].map((chip) => (
          <span
            key={chip}
            data-chip
            className="rounded-full bg-night px-4 py-2 text-[13px] font-semibold text-paper">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
