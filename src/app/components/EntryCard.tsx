import type { Dupe } from '@/lib/supabase';
import { usd } from '@/lib/format';
import Photo from './Photo';
import LivePriceButtons from './LivePriceButtons';

// One "inspired by" fragrance, with its buy buttons.
export default function EntryCard({ entry }: { entry: Dupe }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(28,21,24,0.04)]">
      <div className="flex gap-4">
        <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-line">
          <Photo url={entry.image_url} alt={`${entry.brand} ${entry.name}`} seed={entry.brand + entry.name} sizes="72px" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg leading-snug text-ink">{entry.name}</h3>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-wine-600">{entry.brand}</p>
          {entry.notes && <p className="mt-2 line-clamp-3 text-sm text-smoke">{entry.notes}</p>}
          {usd(entry.price_usd) && (
            <p className="mt-2 text-sm text-smoke">From <span className="font-semibold text-ink">{usd(entry.price_usd)}</span></p>
          )}
        </div>
      </div>
      <LivePriceButtons entry={entry} />
    </article>
  );
}
