'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Search, X, ArrowUpRight } from 'lucide-react';
import type { Dupe } from '@/lib/supabase';
import type { ShownPerfume } from '@/lib/load-catalog';
import { isRealPhoto } from '@/lib/images';
import PerfumeArt from './PerfumeArt';
import LivePriceButtons from './LivePriceButtons';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'male', label: 'For Him' },
  { id: 'female', label: 'For Her' },
  { id: 'unisex', label: 'Unisex' },
] as const;

const usd = (n?: number | null) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : null);
const ils = (n?: number | null) => (n ? `₪${Math.round(n).toLocaleString('en-US')}` : null);

function Photo({ url, alt, seed, sizes }: { url?: string | null; alt: string; seed: string; sizes: string }) {
  return isRealPhoto(url) ? (
    <Image src={url as string} alt={alt} fill sizes={sizes} className="object-cover" />
  ) : (
    <PerfumeArt seed={seed} />
  );
}

export default function Catalog({ perfumes, dupes }: { perfumes: ShownPerfume[]; dupes: Dupe[] }) {
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<(typeof FILTERS)[number]['id']>('all');
  const [selected, setSelected] = useState<ShownPerfume | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return perfumes.filter(p =>
      (gender === 'all' || p.gender === gender) &&
      (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    );
  }, [perfumes, deferredQuery, gender]);

  const entries = useMemo(() => {
    if (!selected) return [];
    return dupes
      .filter(d => d.original_perfume_id === selected.id)
      .sort((a, b) => b.similarity_score - a.similarity_score);
  }, [dupes, selected]);

  // Open / close the native dialog and stop the page behind it from scrolling.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  return (
    <>
      {/* Search + filters */}
      <div className="mx-auto w-full max-w-xl px-4">
        <label htmlFor="search" className="sr-only">Search perfumes or brands</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500" aria-hidden="true" />
          <input
            id="search"
            type="search"
            autoComplete="off"
            placeholder="Search a perfume or brand..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-full border border-gold-500/30 bg-ink-900/80 py-4 pl-14 pr-5 text-base text-ivory placeholder:text-mist/70 shadow-[0_0_0_1px_rgba(0,0,0,0.4)] outline-none transition focus:border-gold-400 focus:shadow-[0_0_0_4px_rgba(212,175,55,0.15)]"
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter by audience">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setGender(f.id)}
              aria-pressed={gender === f.id}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] transition ${
                gender === f.id
                  ? 'border-gold-500 bg-gold-500 text-ink-950'
                  : 'border-gold-500/25 text-mist hover:border-gold-500/60 hover:text-gold-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6" aria-label="Perfumes">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.22em] text-mist" aria-live="polite">
          {perfumes.length === 0 ? '' : `${visible.length} fragrance${visible.length === 1 ? '' : 's'}`}
        </p>

        {perfumes.length === 0 ? (
          <p className="py-20 text-center text-mist">Our collection is being updated. Please check back soon.</p>
        ) : visible.length === 0 ? (
          <p className="py-20 text-center text-mist">No fragrances match your search.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {visible.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={`luxe-card group flex flex-col overflow-hidden rounded-2xl text-left ${i < 12 ? 'rise' : ''} ${p.entryCount === 0 ? 'opacity-75 hover:opacity-100' : ''}`}
                style={i < 12 ? { animationDelay: `${i * 45}ms` } : undefined}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Photo url={p.image_url} alt={`${p.brand} ${p.name}`} seed={p.brand + p.name} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-gold-500/40 bg-black/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gold-300 backdrop-blur sm:left-3 sm:top-3">
                    {p.entryCount > 0 ? `${p.entryCount} similar` : 'Coming soon'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3.5 sm:p-5">
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-500 sm:text-[11px]">{p.brand}</span>
                  <h3 className="mt-1.5 font-serif text-base leading-snug text-ivory sm:text-xl">{p.name}</h3>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-4 text-sm">
                    <span className="text-mist">
                      {usd(p.price_usd)}
                      {ils(p.price_ils) && <span className="ml-2 text-xs opacity-70">{ils(p.price_ils)}</span>}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-gold-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Popup */}
      <dialog
        ref={dialogRef}
        className="luxe-dialog"
        aria-labelledby="perfume-dialog-title"
        onClose={() => setSelected(null)}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setSelected(null); } }}
        onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
      >
        {selected && (
          <div className="luxe-panel flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-gold-500/30 bg-ink-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)]">
            <div className="gold-rule" />
            <header className="flex items-center justify-between gap-4 border-b border-gold-500/15 p-5 sm:p-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-gold-500/25">
                  <Photo url={selected.image_url} alt={`${selected.brand} ${selected.name}`} seed={selected.brand + selected.name} sizes="64px" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500">{selected.brand}</p>
                  <h2 id="perfume-dialog-title" className="truncate font-serif text-2xl text-ivory sm:text-3xl">{selected.name}</h2>
                  {usd(selected.price_usd) && <p className="mt-0.5 text-sm text-mist">Original from {usd(selected.price_usd)}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="shrink-0 rounded-full border border-gold-500/25 p-2 text-mist transition hover:border-gold-500/70 hover:text-gold-300"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-ink-950/60 p-5 sm:p-6">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold-400">Inspired by {selected.name}</h3>

              {entries.length === 0 ? (
                <p className="py-12 text-center text-mist">We are still curating similar scents for this fragrance.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {entries.map(d => (
                    <article key={d.id} className="flex flex-col rounded-2xl border border-gold-500/15 bg-ink-800/70 p-4">
                      <div className="flex gap-4">
                        <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-gold-500/20">
                          <Photo url={d.image_url} alt={`${d.brand} ${d.name}`} seed={d.brand + d.name} sizes="72px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-lg leading-snug text-ivory">{d.name}</h4>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-gold-500">{d.brand}</p>
                          {d.notes && <p className="mt-2 line-clamp-3 text-sm text-mist">{d.notes}</p>}
                          {usd(d.price_usd) && (
                            <p className="mt-2 text-sm text-mist">From <span className="text-gold-300">{usd(d.price_usd)}</span></p>
                          )}
                        </div>
                      </div>
                      <LivePriceButtons dupe={d} />
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
