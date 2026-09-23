'use client';

import { ArrowUpRight, Search } from 'lucide-react';
import { useCountry } from '@/lib/use-country';
import { COUNTRIES, compareUrl } from '@/lib/stores';
import { fmt, getDict, type Lang } from '@/lib/i18n';

// "Where to buy" for one fragrance: compares prices across all the stores in the
// visitor's country. (Direct single-store buttons were removed at the owner's request.)
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
    </div>
  );
}
