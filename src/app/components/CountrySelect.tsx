'use client';

import { Globe } from 'lucide-react';
import { setCountry, useCountry } from '@/lib/use-country';
import { COUNTRY_ORDER, normalizeCountry } from '@/lib/stores';
import { getDict, type Lang } from '@/lib/i18n';

// Lets a visitor choose where they shop from (it is also detected automatically).
export default function CountrySelect({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const country = useCountry();

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-smoke shadow-[0_1px_2px_rgba(28,21,24,0.04)]">
      <Globe className="h-3.5 w-3.5 text-wine-600" aria-hidden="true" />
      <span className="sr-only">{t.shopFrom}</span>
      <select
        value={country ?? ''}
        disabled={!country}
        onChange={e => setCountry(normalizeCountry(e.target.value))}
        className="bg-transparent text-xs font-bold text-ink outline-none"
      >
        {!country && <option value="">…</option>}
        {COUNTRY_ORDER.map(c => (
          <option key={c} value={c}>{t.countries[c]}</option>
        ))}
      </select>
    </label>
  );
}
