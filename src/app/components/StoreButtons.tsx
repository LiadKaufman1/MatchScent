'use client';

import { ArrowUpRight, ExternalLink, Search } from 'lucide-react';
import { useCountry } from '@/lib/use-country';
import { COUNTRIES, compareUrl } from '@/lib/stores';
import { fmt, getDict, type Lang } from '@/lib/i18n';

// "Where to buy" for one fragrance. The big button compares prices across all the
// stores in the visitor's country; the smaller buttons go straight to one store.
export default function StoreButtons({ brand, name, lang }: { brand: string; name: string; lang: Lang }) {
  const t = getDict(lang);
  const country = useCountry();
  const info = country ? COUNTRIES[country] : null;
  const query = `${brand} ${name}`.trim();

  return (
    <div className="mt-auto pt-4">
      {country && info ? (
        <a
          href={compareUrl(query, country, lang)}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group flex w-full items-center gap-3 rounded-xl bg-wine-600 px-4 py-3.5 text-white shadow-[0_14px_24px_-14px_rgba(126,31,55,0.75)] transition hover:bg-wine-700"
        >
          <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-start">
            <span className="block text-[15px] font-bold leading-tight">
              {fmt(t.compareCta, { in: t.countriesIn[country] })}
            </span>
            <span className="mt-0.5 block text-xs text-white/80">{t.compareHint}</span>
          </span>
          <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
        </a>
      ) : (
        <span className="block h-[60px] animate-pulse rounded-xl bg-blush" aria-hidden="true" />
      )}

      <p className="mb-2 mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-smoke">{t.goDirect}</p>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${info ? info.stores.length : 2}, minmax(0, 1fr))` }}
      >
        {info
          ? info.stores.map(store => (
              <a
                key={store.id}
                href={store.url(query)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-wine-600 hover:text-wine-700"
              >
                <span dir="ltr">{store.name}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </a>
            ))
          : [0, 1].map(i => <span key={i} className="h-[38px] animate-pulse rounded-xl bg-blush" aria-hidden="true" />)}
      </div>
    </div>
  );
}
