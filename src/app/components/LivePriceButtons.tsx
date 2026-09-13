'use client';

import { useState } from 'react';
import { ShoppingBag, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLivePrices } from '@/lib/search-prices';
import type { Dupe, LivePrice } from '@/lib/supabase';

export default function LivePriceButtons({ dupe }: { dupe: Dupe }) {
  const [loadingType, setLoadingType] = useState<'il' | 'amazon' | null>(null);
  const [expandedType, setExpandedType] = useState<'il' | 'amazon' | null>(null);
  
  // Initialize with cached data if it exists
  const [pricesIL, setPricesIL] = useState<LivePrice[]>(dupe.live_prices_il || []);
  const [pricesAmazon, setPricesAmazon] = useState<LivePrice[]>(dupe.live_prices_amazon || []);
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

    const res = await fetchLivePrices(dupe.id, dupe.name, dupe.brand, type);
    
    if (res.success && res.prices && res.prices.length > 0) {
      if (type === 'il') setPricesIL(res.prices);
      if (type === 'amazon') setPricesAmazon(res.prices);
      setExpandedType(type);
    } else {
      setError(res.error || 'No prices found.');
    }
    setLoadingType(null);
  };

  return (
    <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-50">
      <div className="grid grid-cols-2 gap-2">
        {/* Buy in Israel Button */}
        <button 
          onClick={() => handleFetch('il')}
          disabled={loadingType === 'il'}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2 px-3 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:bg-slate-700"
        >
          {loadingType === 'il' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              Buy in Israel
              {pricesIL.length > 0 && (
                expandedType === 'il' ? <ChevronUp className="w-3 h-3 ml-1 opacity-70" /> : <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
              )}
            </>
          )}
        </button>

        {/* Amazon Button */}
        <button 
          onClick={() => handleFetch('amazon')}
          disabled={loadingType === 'amazon'}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {loadingType === 'amazon' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Amazon
              {pricesAmazon.length > 0 && (
                expandedType === 'amazon' ? <ChevronUp className="w-3 h-3 ml-1 opacity-70" /> : <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
              )}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="text-xs text-red-500 text-center mt-1">{error}</div>}

      {/* Expandable Results Area */}
      <AnimatePresence>
        {expandedType === 'il' && pricesIL.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase">Found {pricesIL.length} options</span>
              {pricesIL.map((p, i) => (
                <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                  <span className="text-xs font-medium text-slate-700 truncate w-2/3">{p.store}</span>
                  <span className="text-sm font-bold text-slate-900">{p.price}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {expandedType === 'amazon' && pricesAmazon.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase">Top {pricesAmazon.length} results</span>
              {pricesAmazon.map((p, i) => (
                <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                  <span className="text-xs font-medium text-slate-700 truncate w-2/3">{p.store}</span>
                  <span className="text-sm font-bold text-slate-900">{p.price}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
