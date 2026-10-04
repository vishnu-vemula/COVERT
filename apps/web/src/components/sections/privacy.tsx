'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';

import { Shape } from '../ui/shape';

const POINTS = [
  {
    title: 'Signed-in requests only',
    copy: 'The app sends each request with your account’s sign-in token over an encrypted connection. Requests without a valid token are refused.',
  },
  {
    title: 'Your results are yours',
    copy: 'Saved tables belong to a single account. Other accounts can’t open, change or delete them.',
  },
  {
    title: 'Originals aren’t kept',
    copy: 'Photos and PDFs are processed in memory and discarded once converted. What’s saved is the recognized text, the tables and the summary.',
  },
  {
    title: 'Service keys stay on the server',
    copy: 'Text recognition and structuring run on COVERT’s servers. The app never holds those credentials.',
  },
  {
    title: 'Delete whenever you like',
    copy: 'Remove a single document or clear your whole history from Settings.',
  },
] as const;

export function Privacy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-point]', {
          autoAlpha: 0,
          x: 60,
          stagger: 0.08,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-points]', start: 'top 80%' },
        });
        gsap.fromTo(
          '[data-privacy-shape]',
          { yPercent: 30, rotate: -20 },
          {
            yPercent: -10,
            rotate: 25,
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
      id="privacy"
      aria-labelledby="privacy-title"
      className="frame mt-2 scroll-mt-20 rounded-[28px] bg-paper p-2 md:mt-3 md:rounded-[36px] md:p-3">
      <div className="grid gap-2 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[22px] bg-night p-6 text-paper sm:p-8 lg:rounded-[28px] lg:p-10">
          <div
            data-privacy-shape
            aria-hidden
            className="absolute -right-20 -top-20 size-64 sm:size-80">
            <Shape kind="ring" tone="chrome" className="size-full" />
          </div>
          <p className="eyebrow relative text-fog">/Privacy</p>
          <div className="relative">
            <h2
              id="privacy-title"
              className="max-w-[13ch] text-[clamp(2.2rem,4.6vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
              Your account controls your documents.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[16px] leading-[1.6] text-fog">
              To read a document, its image is processed by Google Cloud Vision and the recognized
              text by OpenAI.
            </p>
          </div>
        </div>
        <dl data-points className="grid gap-2">
          {POINTS.map((point, index) => (
            <div
              key={point.title}
              data-point
              className="rounded-[22px] bg-paper-2 px-5 py-5 sm:px-6 lg:rounded-[26px]">
              <dt className="flex items-baseline text-[19px] font-semibold tracking-[-0.02em]">
                <span aria-hidden className="eyebrow w-12 shrink-0 font-normal text-ink/50">
                  /{index + 1}
                </span>
                {point.title}
              </dt>
              <dd className="mt-1.5 pl-12 text-[15px] leading-[1.6] text-ink/65 sm:text-[16px]">
                {point.copy}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
