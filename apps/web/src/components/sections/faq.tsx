'use client';

import { useRef } from 'react';

import { gsap, MOTION, useGSAP } from '@/lib/gsap';
import { FAQS } from '@/lib/site';

import { Shape } from '../ui/shape';

/** Common questions. The same answers are published as FAQPage structured data. */
export function Faq() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('[data-faq]', {
          autoAlpha: 0,
          y: 40,
          stagger: 0.06,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-faqs]', start: 'top 82%' },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="faq"
      aria-labelledby="faq-title"
      className="frame mt-2 scroll-mt-20 rounded-[28px] bg-paper p-2 md:mt-3 md:rounded-[36px] md:p-3">
      <div className="grid gap-2 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[22px] bg-cobalt p-6 text-white sm:p-8 lg:rounded-[28px] lg:p-10">
          <div aria-hidden className="absolute -right-14 -top-14 size-52 sm:size-64">
            <Shape kind="flower" tone="pearl" className="size-full" />
          </div>
          <p className="eyebrow relative text-white/65">/FAQ</p>
          <div className="relative">
            <h2
              id="faq-title"
              className="text-[clamp(2.2rem,4.6vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
              Questions, <span className="font-script font-normal tracking-normal">answered.</span>
            </h2>
            <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.6] text-white/75">
              COVERT is an app for your phone. Everything below happens in the app — this site just
              tells you about it.
            </p>
          </div>
        </div>

        <div data-faqs className="grid content-start gap-2">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
              data-faq
              name="faq"
              open={index === 0}
              className="group rounded-[22px] bg-paper-2 transition-colors open:bg-white lg:rounded-[26px]">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="eyebrow w-8 shrink-0 text-ink/50">
                  /{index + 1}
                </span>
                <h3 className="flex-1 text-[18px] font-semibold tracking-[-0.02em] sm:text-[19px]">
                  {faq.question}
                </h3>
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-night text-paper transition-transform duration-300 group-open:rotate-45">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-[62ch] px-5 pb-6 pl-[4.25rem] text-[15px] leading-[1.65] text-ink/70 sm:px-6 sm:pl-[4.5rem] sm:text-[16px]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
