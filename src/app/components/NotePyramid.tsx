import type { NotePyramid as Pyramid } from '@/lib/supabase';
import { noteGroups, noteLabel } from '@/lib/notes';
import { getDict, type Lang } from '@/lib/i18n';

// The scent pyramid of one fragrance: top notes (first minutes), heart notes (the body),
// base notes (what stays on the skin).
export default function NotePyramid({ pyramid, lang }: { pyramid: Pyramid | null | undefined; lang: Lang }) {
  const t = getDict(lang);
  const groups = noteGroups(pyramid);
  if (groups.length === 0) return null;

  return (
    <section className="mt-14" aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
        {t.notes.heading}
      </h2>
      <div className="grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-3">
        {groups.map(g => (
          <div key={g.key}>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-smoke">{t.notes[g.key]}</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {g.notes.map(n => (
                <li key={n} className="rounded-full border border-line bg-blush px-3 py-1 text-sm font-medium text-ink">
                  {noteLabel(n, lang)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
