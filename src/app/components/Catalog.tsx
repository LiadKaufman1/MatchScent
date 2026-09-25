'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ShownPerfume } from '@/lib/load-catalog';
import { fmt, getDict, type Lang } from '@/lib/i18n';
import PerfumeGridCard from './PerfumeGridCard';

export default function Catalog({ perfumes, lang }: { perfumes: ShownPerfume[]; lang: Lang }) {
  const t = getDict(lang);
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<'all' | 'male' | 'female' | 'unisex'>('all');

  const filters = [
    { id: 'all', label: t.filterAll },
    { id: 'male', label: t.filterMale },
    { id: 'female', label: t.filterFemale },
    { id: 'unisex', label: t.filterUnisex },
  ] as const;

  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return perfumes.filter(p =>
      (gender === 'all' || p.gender === gender) &&
      (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    );
  }, [perfumes, deferredQuery, gender]);

  const countText = visible.length === 1 ? t.countOne : fmt(t.countOther, { n: visible.length });

  return (
    <>
      {/* Search + filters */}
      <div className="mx-auto w-full max-w-xl px-4">
        <label htmlFor="search" className="sr-only">{t.searchLabel}</label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-wine-600" aria-hidden="true" />
          <input
            id="search"
            type="search"
            autoComplete="off"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-full border border-line bg-white py-4 pe-5 ps-14 text-base text-ink shadow-[0_2px_10px_-4px_rgba(28,21,24,0.12)] outline-none transition placeholder:text-smoke/70 focus:border-wine-600 focus:shadow-[0_0_0_4px_rgba(126,31,55,0.12)]"
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2" role="group" aria-label={t.filterLabel}>
          {filters.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setGender(f.id)}
              aria-pressed={gender === f.id}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition ${
                gender === f.id
                  ? 'border-wine-600 bg-wine-600 text-white'
                  : 'border-line bg-white text-smoke hover:border-wine-600/60 hover:text-wine-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6" aria-label={t.brandTag}>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.16em] text-smoke" aria-live="polite">
          {perfumes.length === 0 ? '' : countText}
        </p>

        {perfumes.length === 0 ? (
          <p className="py-20 text-center text-smoke">{t.emptyCollection}</p>
        ) : visible.length === 0 ? (
          <p className="py-20 text-center text-smoke">{t.noMatch}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {visible.map((p, i) => <PerfumeGridCard key={p.id} p={p} lang={lang} index={i} />)}
          </div>
        )}
      </section>
    </>
  );
}
