'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';

import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger animations
 * stay in step with the scroll position. Skipped for reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.11,
      anchors: { offset: -84 },
      stopInertiaOnNavigate: true,
    });
    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
