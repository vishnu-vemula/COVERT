'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';

import { Shape } from '../ui/shape';

const STATEMENT =
  'Values, order and currencies stay exactly as printed. Anything COVERT isn’t sure about is marked for you to check.';

/** A single promise, revealed word by word as it scrolls through the viewport. */
export function Statement() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-word]', {
          opacity: 0.14,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-statement]',
            start: 'top 80%',
            end: 'bottom 45%',
            scrub: true,
          },
        });
        gsap.fromTo(
          '[data-bolt]',
          { rotate: -30, yPercent: 30 },
          {
            rotate: 18,
            yPercent: -30,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
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
      aria-labelledby="statement-title"
      className="frame relative mt-2 overflow-hidden rounded-[28px] bg-night-2 px-6 py-24 text-paper md:mt-3 md:rounded-[36px] md:py-36">
      <div
        data-bolt
        aria-hidden
        className="absolute -right-10 top-1/2 size-48 -translate-y-1/2 sm:size-64 lg:right-4 lg:size-80">
        <Shape kind="bolt" tone="chrome" className="size-full" />
      </div>
      <div
        data-bolt
        aria-hidden
        className="absolute -left-14 bottom-6 size-32 opacity-80 sm:size-44">
        <Shape kind="capsule" className="size-full" />
      </div>
      <h2
        id="statement-title"
        data-statement
        className="relative mx-auto max-w-[24ch] text-center text-[clamp(1.75rem,4.4vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
        {STATEMENT.split(' ').map((word, index) => (
          <span key={index} data-word>
            {word}{' '}
          </span>
        ))}
      </h2>
      <p className="relative mx-auto mt-8 max-w-[44ch] text-center text-[15px] leading-[1.6] text-fog sm:text-[16px]">
        COVERT is instructed never to invent a value that isn’t on the page. Every result is checked
        before it reaches your phone.
      </p>
    </section>
  );
}
