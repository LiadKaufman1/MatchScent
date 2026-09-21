'use client';

import { ExternalLink } from 'lucide-react';
import { useCountry } from '@/lib/use-country';
import { COUNTRIES, compareUrl } from '@/lib/stores';

// "Where to buy" for one fragrance: the stores for the visitor's country.
export default function StoreButtons({ brand, name }: { brand: string; name: string }) {
  const country = useCountry();
  const info = country ? COUNTRIES[country] : null;
  const query = `${brand} ${name}`.trim();

  return (
    <div className="mt-auto pt-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-smoke">
        {info ? `Where to buy · ${info.label}` : 'Where to buy'}
      </p>

      <div
        className="mt-2 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${info ? info.stores.length : 2}, minmax(0, 1fr))` }}
      >
        {info
          ? info.stores.map((store, i) => (
              <a
                key={store.id}
                href={store.url(query)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  i === 0
                    ? 'bg-wine-600 text-white hover:bg-wine-700'
                    : 'border border-wine-600/40 bg-white text-wine-700 hover:border-wine-600 hover:bg-wine-50'
                }`}
              >
                {store.name}
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </a>
            ))
          : [0, 1].map(i => <span key={i} className="h-[42px] animate-pulse rounded-xl bg-blush" aria-hidden="true" />)}
      </div>

      {info && (
        <a
          href={compareUrl(query)}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 inline-block text-xs text-smoke underline decoration-line underline-offset-4 transition hover:text-wine-600"
        >
          Compare prices on Google Shopping
        </a>
      )}
    </div>
  );
}
