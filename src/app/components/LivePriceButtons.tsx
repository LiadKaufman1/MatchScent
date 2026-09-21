'use client';

import { useState } from 'react';
import { ShoppingBag, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchLivePrices } from '@/lib/search-prices';
import type { Dupe, LivePrice } from '@/lib/supabase';

function PriceList({ title, prices }: { title: string; prices: LivePrice[] }) {
  return (
    <div className="fade mt-3 flex flex-col gap-2 rounded-xl border border-line bg-blush p-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-wine-600">{title}</span>
      {prices.map((p, i) => (
        <a
          key={i}
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 transition hover:border-wine-600/50"
        >
          <span className="truncate text-xs text-smoke">{p.store}</span>
          <span className="shrink-0 text-sm font-semibold text-ink">{p.price}</span>
        </a>
      ))}
    </div>
  );
}

export default function LivePriceButtons({ entry }: { entry: Dupe }) {
  const [loadingType, setLoadingType] = useState<'il' | 'amazon' | null>(null);
  const [expandedType, setExpandedType] = useState<'il' | 'amazon' | null>(null);

  // Initialize with cached data if it exists
  const [pricesIL, setPricesIL] = useState<LivePrice[]>(entry.live_prices_il || []);
  const [pricesAmazon, setPricesAmazon] = useState<LivePrice[]>(entry.live_prices_amazon || []);
  const [error, setError] = useState('');

  const handleFetch = async (type: 'il' | 'amazon') => {
    // If we already have prices and the dropdown is closed, just open it
    if (type === 'il' && pricesIL.length > 0) {
      setExpandedType(expandedType === 'il' ? null : 'il');
      return;
    }
    if (type === 'amazon' && pricesAmazon.length > 0) {
      setExpandedType(expandedType === 'amazon' ? null : 'amazon');
      return;
    }

    setLoadingType(type);
    setError('');
    setExpandedType(null);

    const res = await fetchLivePrices(entry.id, type);

    if (res.success && res.prices && res.prices.length > 0) {
      if (type === 'il') setPricesIL(res.prices);
      if (type === 'amazon') setPricesAmazon(res.prices);
      setExpandedType(type);
    } else {
      setError(res.error || 'No prices found.');
    }
    setLoadingType(null);
  };

  const chevron = (open: boolean) =>
    open ? <ChevronUp className="ml-1 h-3 w-3 opacity-70" /> : <ChevronDown className="ml-1 h-3 w-3 opacity-70" />;

  return (
    <div className="mt-auto flex flex-col pt-4">
      <div className="grid grid-cols-2 gap-2">
        {/* Buy in Israel Button */}
        <button
          type="button"
          onClick={() => handleFetch('il')}
          disabled={loadingType === 'il'}
          className="flex items-center justify-center gap-2 rounded-xl bg-wine-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-wine-700 disabled:opacity-60"
        >
          {loadingType === 'il' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Buy in Israel
              {pricesIL.length > 0 && chevron(expandedType === 'il')}
            </>
          )}
        </button>

        {/* Amazon Button */}
        <button
          type="button"
          onClick={() => handleFetch('amazon')}
          disabled={loadingType === 'amazon'}
          className="flex items-center justify-center gap-2 rounded-xl border border-wine-600/40 bg-white px-3 py-2.5 text-sm font-medium text-wine-700 transition hover:border-wine-600 hover:bg-wine-50 disabled:opacity-60"
        >
          {loadingType === 'amazon' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Amazon
              {pricesAmazon.length > 0 && chevron(expandedType === 'amazon')}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="mt-2 text-center text-xs text-red-600">{error}</div>}

      {/* Expandable Results Area */}
      {expandedType === 'il' && pricesIL.length > 0 && <PriceList title={`Found ${pricesIL.length} options`} prices={pricesIL} />}
      {expandedType === 'amazon' && pricesAmazon.length > 0 && <PriceList title={`Top ${pricesAmazon.length} results`} prices={pricesAmazon} />}
    </div>
  );
}
