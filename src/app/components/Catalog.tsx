'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { ShownPerfume } from '@/lib/load-catalog';
import { ils, usd } from '@/lib/format';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from './Photo';
import HoverLink from '@/app/components/HoverLink';

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
            {visible.map((p, i) => (
              <HoverLink
                key={p.id}
                href={withLang(lang, `/perfume/${p.slug}`)}
                className={`site-card group flex flex-col overflow-hidden rounded-2xl text-start ${i < 12 ? 'rise' : ''}`}
                style={i < 12 ? { animationDelay: `${i * 45}ms` } : undefined}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Photo url={p.image_url} alt={`${p.brand} ${p.name}`} seed={p.brand + p.name} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                  <span
                    className={`absolute start-2.5 top-2.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur sm:start-3 sm:top-3 ${
                      p.entryCount > 0
                        ? 'border-wine-600/25 bg-white/90 text-wine-700'
                        : 'border-line bg-white/80 text-smoke'
                    }`}
                  >
                    {p.entryCount > 0 ? fmt(t.similarBadge, { n: p.entryCount }) : t.comingSoon}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3.5 sm:p-5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{p.brand}</span>
                  <h3 className="mt-1.5 text-lg font-bold leading-tight text-ink sm:text-xl">{p.name}</h3>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-4 text-sm">
                    <span className="text-smoke" dir="ltr">
                      {usd(p.price_usd)}
                      {ils(p.price_ils) && <span className="ms-2 text-xs opacity-70">{ils(p.price_ils)}</span>}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-wine-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </div>
                </div>
              </HoverLink>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
