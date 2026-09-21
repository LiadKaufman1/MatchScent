'use client';

import { useSyncExternalStore } from 'react';
import { normalizeCountry, type CountryCode } from './stores';

// One shared "which country is this visitor in" for the whole page.
//   1. a country the visitor picked themselves (remembered in this browser)
//   2. otherwise the country from their connection (/api/country)
//   3. otherwise a guess from the browser's time zone and language
// It is null until known, so the page never flashes the wrong stores.

const KEY = 'ms_country';

let current: CountryCode | null = null;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function guessFromBrowser(): CountryCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toLowerCase();
    if (tz === 'Asia/Jerusalem' || tz === 'Asia/Tel_Aviv' || lang.endsWith('-il')) return 'IL';
    if (tz === 'Europe/London' || lang === 'en-gb') return 'GB';
    if (lang === 'en-us') return 'US';
  } catch {
    // ignore
  }
  return 'WORLD';
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;

  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      current = normalizeCountry(saved);
      emit();
      return;
    }
  } catch {
    // storage blocked: carry on
  }

  fetch('/api/country')
    .then(r => r.json())
    .then((d: { country?: string | null }) => { current = d.country ? normalizeCountry(d.country) : guessFromBrowser(); })
    .catch(() => { current = guessFromBrowser(); })
    .finally(emit);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => { listeners.delete(listener); };
}

export function setCountry(code: CountryCode) {
  current = code;
  try { localStorage.setItem(KEY, code); } catch { /* ignore */ }
  emit();
}

export function useCountry(): CountryCode | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
