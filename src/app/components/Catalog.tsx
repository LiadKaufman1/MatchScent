'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import type { ShownPerfume } from '@/lib/load-catalog';
import { ils, usd } from '@/lib/format';
import Photo from './Photo';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'male', label: 'For Him' },
  { id: 'female', label: 'For Her' },
  { id: 'unisex', label: 'Unisex' },
] as const;

export default function Catalog({ perfumes }: { perfumes: ShownPerfume[] }) {
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<(typeof FILTERS)[number]['id']>('all');

  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return perfumes.filter(p =>
      (gender === 'all' || p.gender === gender) &&
      (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    );
  }, [perfumes, deferredQuery, gender]);

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
              <Link
                key={p.id}
                href={`/perfume/${p.slug}`}
                prefetch={false}
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
