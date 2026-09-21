import type { Dupe } from '@/lib/supabase';
import { usd } from '@/lib/format';
import { getDict, type Lang } from '@/lib/i18n';
import Photo from './Photo';
import StoreButtons from './StoreButtons';

// One "inspired by" fragrance, with its buy buttons.
export default function EntryCard({ entry, lang }: { entry: Dupe; lang: Lang }) {
  const t = getDict(lang);
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(28,21,24,0.04)]">
      <div className="flex gap-4">
        <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-line">
          <Photo url={entry.image_url} alt={`${entry.brand} ${entry.name}`} seed={entry.brand + entry.name} sizes="72px" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight text-ink">{entry.name}</h3>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{entry.brand}</p>
          {entry.notes && <p className="mt-2 line-clamp-3 text-sm text-smoke">{entry.notes}</p>}
          {usd(entry.price_usd) && (
            <p className="mt-2 text-sm text-smoke">
              {t.from} <span className="font-bold text-ink">{usd(entry.price_usd)}</span>
            </p>
          )}
        </div>
      </div>
      <StoreButtons brand={entry.brand} name={entry.name} lang={lang} />
    </article>
  );
}
