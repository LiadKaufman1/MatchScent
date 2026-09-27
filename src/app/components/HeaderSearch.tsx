'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Photo from './Photo';
import { withLang, type Lang } from '@/lib/i18n';
import type { QuickSearchHit } from '@/lib/quick-search';

// The header's search box: typing shows a live dropdown (picture + name) without leaving the page; pressing Enter (or
// clicking "see all results") still opens the full /search page, which also covers brands and notes.
export default function HeaderSearch({ lang, placeholder }: { lang: Lang; placeholder: string }) {
  const [value, setValue] = useState('');
  const [hits, setHits] = useState<QuickSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onChange = (text: string) => {
    setValue(text);
    clearTimeout(timer.current);
    if (text.trim().length < 2) { setHits([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      controller.current?.abort();
      const ac = new AbortController();
      controller.current = ac;
      try {
        const res = await fetch(`/api/quick-search?q=${encodeURIComponent(text)}`, { signal: ac.signal });
        setHits((await res.json()) as QuickSearchHit[]);
        setOpen(true);
      } catch {
        // aborted by a newer keystroke, or the request failed: leave the dropdown as it was
      }
    }, 180);
  };

  return (
    <div ref={boxRef} className="relative hidden min-w-0 flex-1 md:block md:max-w-xs">
      <form action={withLang(lang, '/search')} method="get" role="search">
        <label htmlFor="header-search" className="sr-only">{placeholder}</label>
        <div className="flex items-center gap-2 rounded-full border border-line bg-[#FCFAF9] px-4 py-2 text-sm text-smoke transition focus-within:border-wine-600/60">
          <Search className="h-4 w-4 shrink-0 text-wine-600" aria-hidden="true" />
          <input
            id="header-search"
            name="q"
            type="search"
            autoComplete="off"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => hits.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-smoke"
          />
        </div>
      </form>

      {open && hits.length > 0 && (
        <ul className="absolute start-0 end-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-[0_20px_45px_-20px_rgba(28,21,24,0.35)]">
          {hits.map(h => (
            <li key={h.id}>
              <Link
                href={withLang(lang, `/perfume/${h.slug}`)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-blush"
              >
                <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                  <Photo url={h.image_url} alt={`${h.brand} ${h.name}`} seed={h.brand + h.name} sizes="32px" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-bold uppercase tracking-[0.1em] text-wine-600">{h.brand}</span>
                  <span className="block truncate text-sm font-bold text-ink">{h.name}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
