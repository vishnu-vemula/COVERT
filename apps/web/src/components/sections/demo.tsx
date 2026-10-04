'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';
import { SAMPLE_ROWS, UNCERTAIN_ROW } from '@/lib/sample';

import { Chevrons } from '../button-link';

const STAGES = ['Capture', 'OCR', 'Validate', 'Extract', 'Read', 'Tabulate'] as const;
const WORD = 'STRUCTURED';
/** Horizontal bands the giant word is cut into, each sliding on its own. */
const SLICES = [
  { clip: 'inset(0 0 64% 0)', shift: -9 },
  { clip: 'inset(36% 0 30% 0)', shift: 6 },
  { clip: 'inset(70% 0 0 0)', shift: -4 },
] as const;

/**
 * Before and after: a photographed bill becomes the table COVERT makes from it.
 * Opens with the pipeline as a chain of stages and a giant cut-up headline.
 */
export function Demo() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-stage]', {
          autoAlpha: 0,
          y: 24,
          stagger: 0.06,
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-stages]', start: 'top 85%' },
        });

        // The cut bands start offset and lock together as the word scrolls in.
        const word = { trigger: '[data-word]', start: 'top 95%', end: 'bottom 45%', scrub: 0.6 };
        gsap.utils.toArray<HTMLElement>('[data-slice]').forEach((slice, index) => {
          gsap.fromTo(
            slice,
            { xPercent: SLICES[index]?.shift ?? 0 },
            { xPercent: 0, ease: 'none', scrollTrigger: word },
          );
        });
        gsap.fromTo(
          '[data-script]',
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            ease: 'power2.out',
            duration: 1.6,
            scrollTrigger: { trigger: '[data-word]', start: 'top 55%' },
          },
        );

        const pair = gsap.timeline({
          defaults: { ease: 'expo.out' },
          scrollTrigger: { trigger: '[data-pair]', start: 'top 75%' },
        });
        pair
          .from('[data-bill]', { x: -80, rotate: -9, autoAlpha: 0, duration: 1.4 })
          .from('[data-link]', { scale: 0, duration: 0.8, ease: 'power3.inOut' }, 0.3)
          .from('[data-result]', { x: 80, rotate: 4, autoAlpha: 0, duration: 1.4 }, 0.45)
          .from('[data-row]', { autoAlpha: 0, x: 18, stagger: 0.06, duration: 0.7 }, 0.8)
          .from('[data-flag]', { scale: 0, duration: 0.6, ease: 'back.out(3)' }, '>-0.1');

        gsap.from('[data-closing] span', {
          autoAlpha: 0.12,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: '[data-closing]', start: 'top 85%', end: 'bottom 60%', scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="product"
      aria-labelledby="product-title"
      className="scroll-mt-20 overflow-hidden bg-night py-20 text-paper lg:py-32">
      <div className="container-page">
        <ol
          data-stages
          aria-label="How COVERT handles a document"
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3 lg:justify-between">
          {STAGES.map((stage, index) => (
            <li key={stage} data-stage className="flex items-center gap-2 sm:gap-3">
              <span className="rounded-full px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] ring-1 ring-paper/45 sm:px-5 sm:text-[13px]">
                {stage}
              </span>
              {index < STAGES.length - 1 ? <Chevrons className="text-flare" /> : null}
            </li>
          ))}
        </ol>
      </div>

      <div data-word className="relative mt-14 select-none lg:mt-20">
        <h2 id="product-title" className="sr-only">
          A photo of a bill becomes a table you can work with
        </h2>
        <div aria-hidden className="relative">
          {/* Invisible copy holds the height; the bands sit on top of it. */}
          <p className="invisible whitespace-nowrap text-center font-condensed text-[19.5vw] leading-[0.86]">
            {WORD}
          </p>
          {SLICES.map((slice) => (
            <p
              key={slice.clip}
              data-slice
              style={{ clipPath: slice.clip }}
              className="absolute inset-0 whitespace-nowrap text-center font-condensed text-[19.5vw] leading-[0.86] text-paper">
              {WORD}
            </p>
          ))}
          <p
            data-script
            className="absolute left-1/2 top-[38%] -translate-x-1/2 -rotate-6 whitespace-nowrap font-script text-[clamp(3.2rem,10vw,9.5rem)] leading-none text-flare">
            from any document
          </p>
        </div>
      </div>

      <div className="container-page">
        <div
          data-pair
          className="mt-16 grid items-center gap-6 lg:mt-24 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <SourceDocument />
          <Connector />
          <ResultTable />
        </div>

        <p
          data-closing
          className="mx-auto mt-20 max-w-[64ch] text-center text-[13px] font-medium uppercase leading-[1.8] tracking-[0.06em] text-paper sm:text-[15px]">
          {'A photo of a bill becomes a table you can work with. Values, order and currencies stay exactly as printed — edit any cell, copy the table or export it as CSV.'
            .split(' ')
            .map((word, index) => (
              <span key={index}>{word} </span>
            ))}
        </p>
      </div>
    </section>
  );
}

function SourceDocument() {
  return (
    <figure data-bill className="mx-auto w-full max-w-[440px]">
      <div
        role="img"
        aria-label="A photographed electricity bill listing daily units and amounts for 1 to 7 September."
        className="relative -rotate-[2deg] rounded-[6px] bg-[#f4f1e8] px-6 py-7 font-mono text-[12px] leading-[1.7] text-ink/80 shadow-[0_40px_60px_-30px_rgba(0,0,0,0.9)] grayscale sm:px-8 sm:text-[13px]">
        <div aria-hidden className="absolute inset-x-0 top-[46%] h-px bg-ink/[0.07]" />
        <div aria-hidden>
          <p className="text-center text-[13px] font-bold tracking-[0.18em] text-ink sm:text-[14px]">
            COASTAL POWER
          </p>
          <p className="text-center text-[10px] tracking-[0.2em] text-ink/50">ELECTRICITY BILL</p>
          <div className="mt-5 flex justify-between gap-4 text-[11px] sm:text-[12px]">
            <span>Consumer No.</span>
            <span className="tabular">1155 0482 9031</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] sm:text-[12px]">
            <span>Period</span>
            <span>01–07 SEP</span>
          </div>
          <div className="mt-4 border-y border-dashed border-ink/30 py-1 [word-spacing:0.4em]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 font-semibold">
              <span>DATE</span>
              <span className="text-right">UNITS</span>
              <span className="text-right">AMT Rs</span>
            </div>
          </div>
          <div className="py-1">
            {SAMPLE_ROWS.map((row, index) => (
              <div key={row.date} className="grid grid-cols-[1fr_auto_auto] gap-x-6 tabular">
                <span className={index === 4 ? 'pl-[2px]' : ''}>{row.date.toUpperCase()}</span>
                <span className="text-right">{row.units}</span>
                <span className="text-right">
                  {index === UNCERTAIN_ROW ? (
                    <span className="opacity-60 blur-[0.4px]">3O7.00</span>
                  ) : (
                    `${row.amount.replace('₹', '')}.00`
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-t border-dashed border-ink/30 pt-1 font-semibold tabular">
            <span>TOTAL</span>
            <span className="text-right">280</span>
            <span className="text-right">2,262.00</span>
          </div>
          <p className="mt-5 text-center text-[10px] tracking-[0.16em] text-ink/40">
            THANK YOU FOR PAYING ON TIME
          </p>
        </div>
      </div>
      <figcaption className="eyebrow mt-5 text-center text-fog">/Before — a photographed bill</figcaption>
    </figure>
  );
}

function Connector() {
  return (
    <div aria-hidden className="flex items-center justify-center lg:flex-col">
      <span
        data-link
        className="h-px w-10 origin-left bg-paper/30 lg:h-10 lg:w-px lg:origin-top"
      />
      <span className="mx-3 rounded-full bg-flare px-4 py-2 font-condensed text-[15px] tracking-[0.06em] text-night lg:mx-0 lg:my-3">
        COVERT
      </span>
      <span
        data-link
        className="h-px w-10 origin-left bg-paper/30 lg:h-10 lg:w-px lg:origin-top"
      />
    </div>
  );
}

function ResultTable() {
  return (
    <figure data-result className="mx-auto w-full max-w-[440px]">
      <div className="overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_40px_60px_-34px_rgba(0,0,0,0.9)]">
        <div className="flex items-end justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
          <div>
            <p className="text-[19px] font-semibold tracking-[-0.02em]">Daily readings</p>
            <p className="mt-0.5 text-[13px] text-ink/60">7 rows · 3 columns</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-review-wash px-2.5 py-1 text-[12px] font-medium text-review">
            <span aria-hidden className="size-1.5 rounded-full bg-review" />1 to review
          </span>
        </div>
        <table className="w-full border-collapse text-[15px] tabular">
          <caption className="sr-only">
            Table extracted from the bill: date, units and amount for each day.
          </caption>
          <thead>
            <tr className="border-y-[1.5px] border-b-ink border-t-paper-3 bg-paper-2 text-left text-[13px]">
              <th scope="col" className="px-5 py-3 font-bold sm:px-6">
                Date
              </th>
              <th scope="col" className="px-3 py-3 text-right font-bold">
                Units
              </th>
              <th scope="col" className="px-5 py-3 text-right font-bold sm:px-6">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row, index) => (
              <tr key={row.date} data-row className="border-b border-paper-3 last:border-0">
                <td className="px-5 py-3 sm:px-6">{row.date}</td>
                <td className="px-3 py-3 text-right">{row.units}</td>
                <td
                  className={`relative px-5 py-3 text-right sm:px-6 ${index === UNCERTAIN_ROW ? 'bg-review-wash' : ''}`}>
                  {row.amount}
                  {index === UNCERTAIN_ROW ? (
                    <>
                      <span
                        data-flag
                        aria-hidden
                        className="absolute right-2 top-2 size-2 rounded-full bg-review"
                      />
                      <span className="sr-only"> (uncertain: printed as 3O7)</span>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="eyebrow mt-5 text-center text-fog">/After — an editable table</figcaption>
    </figure>
  );
}
