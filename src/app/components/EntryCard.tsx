import Link from 'next/link';
import type { Dupe } from '@/lib/supabase';
import { slugify } from '@/lib/slug';
import { usd } from '@/lib/format';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import { noteGroups, noteLabel } from '@/lib/notes';
import { entryKey, type EntryVoteCounts } from '@/lib/load-catalog';
import Photo from './Photo';
import StoreButtons from './StoreButtons';
import EntryVotes from './EntryVotes';

// One "inspired by" fragrance: its picture, main notes, the community's vote on how
// close it is to the original, and the price-comparison button.
export default function EntryCard({ entry, lang, perfumeId, votes, rank }: {
  entry: Dupe;
  rank?: number;
  lang: Lang;
  perfumeId: string;
  votes?: EntryVoteCounts;
}) {
  const t = getDict(lang);
  const mainNotes = noteGroups(entry.note_pyramid).flatMap(g => g.notes).slice(0, 6).map(n => noteLabel(n, lang));
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(28,21,24,0.04)]">
      <div className="flex gap-4">
        <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border border-line">
          <Photo url={entry.image_url} alt={`${entry.brand} ${entry.name}`} seed={entry.brand + entry.name} sizes="112px" />
          {rank ? (
            <span className="absolute start-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-wine-600 px-1.5 text-xs font-extrabold text-white shadow" dir="ltr">{rank}</span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight text-ink">{entry.name}</h3>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">
            <Link href={withLang(lang, `/brand/${slugify(entry.brand)}`)} prefetch={false} className="transition hover:text-wine-700">{entry.brand}</Link>
          </p>
          {mainNotes.length > 0 && <p className="mt-2 text-sm text-smoke">{mainNotes.join(' · ')}</p>}
          {entry.notes && <p className="mt-2 line-clamp-3 text-sm text-smoke">{entry.notes}</p>}
          {usd(entry.price_usd) && (
            <p className="mt-2 text-sm text-smoke">
              {t.from} <span className="font-bold text-ink">{usd(entry.price_usd)}</span>
            </p>
          )}
        </div>
      </div>
      <EntryVotes lang={lang} perfumeId={perfumeId} entryKey={entryKey(entry.brand, entry.name)} up={votes?.up ?? 0} down={votes?.down ?? 0} />
      <StoreButtons brand={entry.brand} name={entry.name} lang={lang} />
    </article>
  );
}
