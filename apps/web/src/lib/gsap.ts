'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Media conditions shared by every animated section. */
export const MOTION = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

export const DESKTOP_MOTION = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

export { gsap, ScrollTrigger, useGSAP };
