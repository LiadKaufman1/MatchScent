'use client';

import { useSyncExternalStore } from 'react';

// The visitor's accessibility choices. They are saved in this browser and applied as
// attributes on <html> (data-a11y-*), which the styles in globals.css react to.

export type A11y = { size: number; contrast: number; links: number; readable: number; still: number };

const KEY = 'ms_a11y';
export const MAX_SIZE = 3;
const DEFAULT: A11y = { size: 0, contrast: 0, links: 0, readable: 0, still: 0 };
const FIELDS = ['size', 'contrast', 'links', 'readable', 'still'] as const;

let current: A11y = DEFAULT;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function read(): A11y {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      size: clamp(Number(s.size) || 0, 0, MAX_SIZE),
      contrast: s.contrast ? 1 : 0,
      links: s.links ? 1 : 0,
      readable: s.readable ? 1 : 0,
      still: s.still ? 1 : 0,
    };
  } catch {
    return DEFAULT;
  }
}

function apply(a: A11y) {
  const root = document.documentElement;
  for (const f of FIELDS) {
    if (a[f]) root.setAttribute(`data-a11y-${f}`, String(a[f]));
    else root.removeAttribute(`data-a11y-${f}`);
  }
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  current = read();
  apply(current);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => { listeners.delete(listener); };
}

export function setA11y(patch: Partial<A11y>) {
  current = { ...current, ...patch };
  current.size = clamp(current.size, 0, MAX_SIZE);
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  apply(current);
  emit();
}

export function resetA11y() {
  current = DEFAULT;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  apply(current);
  emit();
}

export function useA11y(): A11y {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT);
}
