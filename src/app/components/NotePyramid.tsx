import Link from 'next/link';
import type { NotePyramid as Pyramid } from '@/lib/supabase';
import { noteGroups, noteLabel } from '@/lib/notes';
import { slugify } from '@/lib/slug';
import { scentColor } from '@/lib/scent-colors';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';

// The scent pyramid of one fragrance: top notes (first minutes), heart notes (the body),
// base notes (what stays on the skin). A note that many members said they smell (older votes) is shown bigger.
export default function NotePyramid({ pyramid, lang, noteVotes = {} }: {
  pyramid: Pyramid | null | undefined;
  lang: Lang;
  noteVotes?: Record<string, number>;
}) {
  const t = getDict(lang);
  const groups = noteGroups(pyramid);
  if (groups.length === 0) return null;

  const max = Math.max(1, ...Object.values(noteVotes));
  const size = (n: string) => {
    const share = (noteVotes[n.toLowerCase()] ?? 0) / max;
    return share > 0.66 ? 'text-base px-3.5 py-1.5' : share > 0.33 ? 'text-[15px] px-3 py-1' : 'text-sm px-3 py-1';
  };

  return (
    <section className="mt-14" aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="section-title mb-5">{t.notes.heading}</h2>
      <div className="space-y-6 rounded-3xl border border-line bg-white px-5 py-7">
        {groups.map(g => (
          <div key={g.key}>
            <h3 className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-smoke before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
              {t.notes[g.key]}
            </h3>
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {g.notes.map(n => {
                const count = noteVotes[n.toLowerCase()] ?? 0;
                return (
                  <li key={n}>
                    <Link
                      href={withLang(lang, `/notes/${slugify(n)}`)}
                      prefetch={false}
                      title={count > 0 ? fmt(t.noteVotes.count, { n: count }) : undefined}
                      className={`block rounded-full border border-line bg-[#FCFAF9] font-medium text-ink transition hover:border-wine-600/50 hover:bg-white ${size(n)}`}
                    >
                      <span aria-hidden="true" className="me-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: scentColor(n) }} />
                      {noteLabel(n, lang)}{count > 0 && <span className="ms-1.5 text-xs text-smoke" dir="ltr">{count}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
