'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';
import { SAMPLE_ROWS } from '@/lib/sample';

import { ReaderBarVisual } from '../reader-bar-visual';
import { Shape } from '../ui/shape';

const DETAILS = [
  { value: '0.75–2×', label: 'Choose the reading speed' },
  { value: 'Row by row', label: 'Step back or forward at any point' },
  { value: 'Summary', label: 'Or the whole table, record by record' },
  { value: 'Names on/off', label: 'Hear column names, or just the values' },
] as const;

const READING = 3;
const BARS = 36;

export function Audio() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-detail]', {
          autoAlpha: 0,
          y: 40,
          stagger: 0.08,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-details]', start: 'top 85%' },
        });
        gsap.from('[data-player]', {
          y: 90,
          rotate: 3,
          autoAlpha: 0,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-player]', start: 'top 85%' },
        });
        gsap.to('[data-bar]', {
          scaleY: () => gsap.utils.random(0.15, 1),
          duration: 0.32,
          ease: 'sine.inOut',
          stagger: { each: 0.03, repeat: -1, yoyo: true },
          repeatRefresh: true,
        });
        gsap.to('[data-audio-shape]', {
          rotate: 120,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="audio"
      aria-labelledby="audio-title"
      className="frame relative mt-2 overflow-hidden rounded-[28px] bg-cobalt p-2 text-white md:mt-3 md:rounded-[36px] md:p-3">
      <div
        data-audio-shape
        aria-hidden
        className="absolute -left-24 -top-24 size-80 opacity-60 mix-blend-screen">
        <Shape kind="ring" className="size-full" />
      </div>
      <div className="relative grid gap-2 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col justify-between gap-12 px-4 pb-6 pt-14 sm:px-6 lg:px-8 lg:pt-16">
          <div>
            <p className="eyebrow text-white/65">/Audio</p>
            <h2
              id="audio-title"
              className="mt-3 text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
              Hear your <span className="font-script font-normal tracking-normal">data.</span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-[18px] leading-[1.5] text-white/75">
              Listen to a summary or move through a table one record at a time, with your device’s
              own voice.
            </p>
          </div>
          <dl data-details className="grid grid-cols-2 gap-y-8">
            {DETAILS.map((detail, index) => (
              <div
                key={detail.value}
                data-detail
                className={`pr-4 ${index % 2 ? 'border-l border-white/25 pl-5' : ''}`}>
                <dt className="text-[clamp(1.4rem,2.6vw,2.1rem)] font-semibold leading-none tracking-[-0.035em]">
                  {detail.value}
                </dt>
                <dd className="mt-2 text-[14px] leading-[1.45] text-white/70">{detail.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          data-player
          role="img"
          aria-label="Audio controls reading row four of a table aloud: Date, September 4. Units, 41. Amount, 331 rupees."
          className="rounded-[22px] bg-paper p-3 text-ink sm:p-4 lg:rounded-[28px]">
          <div aria-hidden>
            <div className="flex items-center justify-between px-2 pb-3 pt-1">
              <span className="eyebrow text-ink/55">/Reading aloud</span>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                <span className="size-2 animate-pulse rounded-full bg-flare" /> Live
              </span>
            </div>
            <div className="rounded-[20px] bg-white p-2">
              {SAMPLE_ROWS.slice(1, 6).map((row, offset) => {
                const active = offset + 1 === READING;
                return (
                  <div
                    key={row.date}
                    className={`grid grid-cols-[1.3fr_0.7fr_1fr] rounded-full px-5 py-3 text-[15px] tabular ${active ? 'bg-night font-semibold text-paper' : 'text-ink/55'}`}>
                    <span>{row.date}</span>
                    <span className="text-right">{row.units}</span>
                    <span className="text-right">{row.amount}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex h-16 items-center justify-center gap-[3px] rounded-[20px] bg-paper-2 px-4">
              {Array.from({ length: BARS }, (_, index) => (
                <span
                  key={index}
                  data-bar
                  style={{ transform: `scaleY(${0.25 + ((index * 37) % 11) / 14})` }}
                  className="h-10 w-[4px] origin-center rounded-full bg-cobalt"
                />
              ))}
            </div>
            <p className="mx-2 mt-4 text-[17px] font-medium leading-[1.5] text-cobalt sm:text-[19px]">
              “Row four. Date, September 4. Units, 41. Amount, 331 rupees.”
            </p>
            <div className="mt-4">
              <ReaderBarVisual status="Row 4 of 30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
