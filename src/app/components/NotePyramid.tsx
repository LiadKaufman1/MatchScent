'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import type { NotePyramid as Pyramid } from '@/lib/supabase';
import { noteGroups, noteLabel } from '@/lib/notes';
import { slugify } from '@/lib/slug';
import { scentColor } from '@/lib/scent-colors';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { toggleNoteVote } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';

// The scent pyramid of one fragrance: top notes (first minutes), heart notes (the body),
// base notes (what stays on the skin). Like Fragrantica, members can vote for the notes they
// really smell; a note that many members smell is shown bigger.
export default function NotePyramid({ pyramid, lang, perfumeId, noteVotes = {} }: {
  pyramid: Pyramid | null | undefined;
  lang: Lang;
  perfumeId: string;
  noteVotes?: Record<string, number>;
}) {
  const t = getDict(lang);
  const groups = noteGroups(pyramid);
  const { ready, userId } = useViewer();
  const [voting, setVoting] = useState(false);
  const [counts, setCounts] = useState(noteVotes);
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const { data } = await getSupabaseBrowser().from('note_votes').select('note').eq('perfume_id', perfumeId).eq('user_id', userId);
      if (active) setMine(Object.fromEntries(((data ?? []) as { note: string }[]).map(r => [r.note, true])));
    })();
    return () => { active = false; };
  }, [perfumeId, userId]);

  if (groups.length === 0) return null;

  const max = Math.max(1, ...Object.values(counts));
  const size = (n: string) => {
    const share = (counts[n.toLowerCase()] ?? 0) / max;
    return share > 0.66 ? 'text-base px-3.5 py-1.5' : share > 0.33 ? 'text-[15px] px-3 py-1' : 'text-sm px-3 py-1';
  };

  const toggle = (note: string) => {
    const key = note.toLowerCase();
    const on = !(userId && mine[key]);
    setMine(m => ({ ...m, [key]: on }));
    setCounts(c => ({ ...c, [key]: Math.max(0, (c[key] ?? 0) + (on ? 1 : -1)) }));
    startTransition(async () => { await toggleNoteVote(perfumeId, note, on); });
  };

  return (
    <section className="mt-14" aria-labelledby="notes-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="notes-heading" className="section-title">{t.notes.heading}</h2>
        {userId ? (
          <button
            type="button"
            aria-pressed={voting}
            onClick={() => setVoting(v => !v)}
            className={`rounded-full border px-3.5 py-1 text-xs font-bold transition ${voting ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white text-wine-600 hover:border-wine-600/60'}`}
          >
            {voting ? t.noteVotes.done : t.noteVotes.vote}
          </button>
        ) : ready ? (
          <Link href={withLang(lang, '/login')} className="text-xs font-bold text-wine-600 underline underline-offset-4">{t.noteVotes.login}</Link>
        ) : null}
      </div>
      {voting && <p className="mb-3 text-sm text-smoke">{t.noteVotes.hint}</p>}
      <div className="space-y-6 rounded-3xl border border-line bg-white px-5 py-7">
        {groups.map(g => (
          <div key={g.key}>
            <h3 className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-smoke before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
              {t.notes[g.key]}
            </h3>
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {g.notes.map(n => {
                const key = n.toLowerCase();
                const count = counts[key] ?? 0;
                const label = noteLabel(n, lang);
                const title = count > 0 ? fmt(t.noteVotes.count, { n: count }) : undefined;
                return (
                  <li key={n}>
                    {voting ? (
                      <button
                        type="button"
                        disabled={pending}
                        aria-pressed={!!mine[key]}
                        onClick={() => toggle(n)}
                        title={title}
                        className={`block rounded-full border font-medium transition ${size(n)} ${
                          mine[key] ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-blush text-ink hover:border-wine-600/50'
                        }`}
                      >
                        <span aria-hidden="true" className="me-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle ring-1 ring-white/70" style={{ backgroundColor: scentColor(n) }} />
                        {label}{count > 0 && <span className="ms-1.5 text-xs opacity-80" dir="ltr">{count}</span>}
                      </button>
                    ) : (
                      <Link
                        href={withLang(lang, `/notes/${slugify(n)}`)}
                        prefetch={false}
                        title={title}
                        className={`block rounded-full border border-line bg-[#FCFAF9] font-medium text-ink transition hover:border-wine-600/50 hover:bg-white ${size(n)}`}
                      >
                        <span aria-hidden="true" className="me-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: scentColor(n) }} />
                        {label}{count > 0 && <span className="ms-1.5 text-xs text-smoke" dir="ltr">{count}</span>}
                      </Link>
                    )}
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
