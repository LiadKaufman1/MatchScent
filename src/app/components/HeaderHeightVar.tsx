'use client';

import { useEffect } from 'react';

// The header is now sticky (always visible while scrolling). It wraps to two lines on narrow screens, so its height
// is not a fixed number: this keeps the CSS variable --header-h in sync with it, so the in-page section menus
// (.section-nav, see globals.css) and anchor jumps (scroll-margin-top on [id]) sit right below it, never under it.
export default function HeaderHeightVar() {
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const set = () => document.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(header);
    window.addEventListener('resize', set);
    return () => { ro.disconnect(); window.removeEventListener('resize', set); };
  }, []);
  return null;
}
