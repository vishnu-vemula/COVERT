'use client';

import { useEffect, useRef, useState } from 'react';

import { gsap, MOTION, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { LINKS } from '@/lib/links';

import { ArrowBadge, ArrowUpRight, ButtonLink } from './button-link';
import { Logo } from './logo';

const ITEMS = [
  { id: 'product', label: 'Product' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'documents', label: 'Documents' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'faq', label: 'FAQ' },
] as const;

type SectionId = (typeof ITEMS)[number]['id'];

/**
 * Floating dark nav bar, inset to line up with the hero's cards. A pill slides
 * under the section in view; below `xl` the links move into a menu. The bar
 * slides away while scrolling down and returns on the way up.
 */
export function SiteNav() {
  const bar = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  const [active, setActive] = useState<SectionId | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useGSAP(
    () => {
      // Track which section is in view.
      ITEMS.forEach((item) => {
        // Resolve the element directly: a selector would be scoped to the nav.
        const section = document.getElementById(item.id);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: 'top 45%',
          end: 'bottom 45%',
          // The nav mounts first; measure after the pinned section adds its spacing.
          refreshPriority: -1,
          onToggle: (self) => {
            if (self.isActive) setActive(item.id);
            else setActive((current) => (current === item.id ? null : current));
          },
        });
      });

      const mm = gsap.matchMedia();
      mm.add(MOTION.motion, () => {
        gsap.from('nav', {
          yPercent: -160,
          autoAlpha: 0,
          duration: 1,
          ease: 'expo.out',
          delay: 0.9,
        });
        const hide = gsap.to(bar.current, {
          yPercent: -180,
          duration: 0.45,
          ease: 'power3.inOut',
          paused: true,
        });
        ScrollTrigger.create({
          start: 'top top-=240',
          end: 'max',
          onUpdate: (self) => {
            if (openRef.current) return;
            if (self.direction === 1) hide.play();
            else hide.reverse();
          },
          onLeaveBack: () => hide.reverse(),
        });
      });
      return () => mm.revert();
    },
    { scope: bar },
  );

  // Slide the pill under the active link.
  useGSAP(
    () => {
      const pill = indicator.current;
      const link = active
        ? list.current?.querySelector<HTMLElement>(`[data-section="${active}"]`)
        : null;
      if (!pill) return;
      if (!link) {
        gsap.to(pill, { autoAlpha: 0, duration: 0.3 });
        return;
      }
      const instant = !pill.style.width;
      gsap.to(pill, {
        x: link.offsetLeft,
        width: link.offsetWidth,
        autoAlpha: 1,
        duration: instant ? 0 : 0.5,
        ease: 'power3.out',
      });
    },
    { dependencies: [active], scope: bar },
  );

  // Close the menu on Escape, outside clicks and a wider viewport.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    const onPointer = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) setOpen(false);
    };
    const wide = window.matchMedia('(min-width: 1280px)');
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <header ref={bar} className="fixed inset-x-0 top-4 z-50 px-4 md:top-6 md:px-6">
      <nav
        aria-label="Main"
        data-intro
        className="relative grid h-14 grid-cols-[1fr_auto] items-center gap-3 rounded-full bg-night/90 p-2 text-paper shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur-md xl:grid-cols-[1fr_auto_1fr]">
        <ul ref={list} className="relative hidden h-10 items-center xl:flex">
          <span
            ref={indicator}
            aria-hidden
            className="invisible absolute left-0 top-0 h-10 rounded-full bg-white/12 opacity-0"
          />
          {ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                data-section={item.id}
                aria-current={active === item.id ? 'location' : undefined}
                className="flex h-10 items-center whitespace-nowrap rounded-full px-4 text-[14px] font-medium text-fog transition-colors hover:text-paper aria-[current]:text-paper">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#top"
          aria-label="COVERT, back to top"
          className="flex h-10 items-center rounded-full pl-3 xl:justify-self-center xl:px-3">
          <Logo label={null} className="h-[18px] w-auto xl:h-5" />
        </a>

        <div className="flex items-center justify-end gap-1.5">
          <a
            href={LINKS.github}
            className="hidden h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-fog transition-colors hover:bg-white/10 hover:text-paper xl:inline-flex">
            GitHub
            <ArrowUpRight className="size-3.5" />
          </a>
          <ButtonLink href={LINKS.getApp} variant="paper" size="md">
            Get the app
            <ArrowBadge size="md" className="bg-night text-paper" />
          </ButtonLink>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 xl:hidden">
            <span aria-hidden className="relative block h-3 w-4">
              <span
                className={`absolute left-0 h-[2px] w-4 rounded-full bg-current transition-transform duration-300 ${open ? 'top-[5px] rotate-45' : 'top-0'}`}
              />
              <span
                className={`absolute left-0 h-[2px] w-4 rounded-full bg-current transition-transform duration-300 ${open ? 'top-[5px] -rotate-45' : 'top-[10px]'}`}
              />
            </span>
          </button>
        </div>

        <div
          id="site-menu"
          data-open={open || undefined}
          className="invisible absolute inset-x-0 top-[calc(100%+8px)] -translate-y-2 rounded-[28px] bg-night p-2 opacity-0 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-[opacity,transform,visibility] duration-300 data-[open]:visible data-[open]:translate-y-0 data-[open]:opacity-100 xl:hidden">
          <ul className="grid">
            {ITEMS.map((item, index) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === item.id ? 'location' : undefined}
                  className="flex items-center justify-between rounded-[20px] px-4 py-3.5 text-[22px] font-semibold tracking-[-0.02em] text-paper/85 transition-colors hover:bg-white/10 hover:text-paper aria-[current]:bg-white/10 aria-[current]:text-paper">
                  {item.label}
                  <span className="eyebrow text-fog">/{index + 1}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <a
              href={LINKS.appStore}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-[20px] bg-paper px-4 py-3 text-ink">
              <span>
                <span className="block text-[12px] text-ink/60">For iPhone</span>
                <span className="block text-[17px] font-semibold">App Store</span>
              </span>
              <ArrowUpRight className="size-4" />
            </a>
            <a
              href={LINKS.googlePlay}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-[20px] bg-cobalt px-4 py-3 text-white">
              <span>
                <span className="block text-[12px] text-white/70">For Android</span>
                <span className="block text-[17px] font-semibold">Google Play</span>
              </span>
              <ArrowUpRight className="size-4" />
            </a>
          </div>
          <p className="px-4 pb-2 pt-4 text-[13px] text-fog">
            COVERT is a mobile app. This website is its landing page.
          </p>
        </div>
      </nav>
    </header>
  );
}
