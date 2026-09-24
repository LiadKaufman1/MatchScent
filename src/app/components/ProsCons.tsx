'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { addPoint, deletePoint, votePoint } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import type { PointRow } from '@/lib/community-types';

// "What people say": short pros and cons written by members, each with thumbs up / down
// from other members (the numbers come from the server; this visitor's own votes are read here).
export default function ProsCons({ lang, perfumeId, points: initial }: { lang: Lang; perfumeId: string; points: PointRow[] }) {
  const t = getDict(lang);
  const c = t.community.points;
  const { ready, userId } = useViewer();
  const [points, setPoints] = useState(initial);
  const [mine, setMine] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<{ pro: string; con: string }>({ pro: '', con: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!userId || initial.length === 0) return;
    let active = true;
    (async () => {
      const { data } = await getSupabaseBrowser()
        .from('point_votes')
        .select('point_id, vote')
        .eq('user_id', userId)
        .in('point_id', initial.map(p => p.id));
      if (active) setMine(Object.fromEntries(((data ?? []) as { point_id: string; vote: number }[]).map(r => [r.point_id, r.vote])));
    })();
    return () => { active = false; };
  }, [userId, initial]);

  const myVote = (id: string) => (userId ? mine[id] ?? 0 : 0);

  const vote = (point: PointRow, value: 1 | -1) => {
    const before = myVote(point.id);
    const next = before === value ? 0 : value;
    setPoints(list => list.map(p => (p.id !== point.id ? p : {
      ...p,
      up: p.up + (next === 1 ? 1 : 0) - (before === 1 ? 1 : 0),
      down: p.down + (next === -1 ? 1 : 0) - (before === -1 ? 1 : 0),
    })));
    setMine(m => ({ ...m, [point.id]: next }));
    startTransition(async () => { await votePoint(point.id, next as -1 | 0 | 1); });
  };

  const add = (kind: 'pro' | 'con') => {
    const body = drafts[kind].replace(/\s+/g, ' ').trim();
    if (body.length < 3) return;
    startTransition(async () => {
      const result = await addPoint(perfumeId, kind, body);
      if (!result.success || !result.id) { setMessage(t.auth.errorGeneric); return; }
      setMessage(null);
      setDrafts(d => ({ ...d, [kind]: '' }));
      setPoints(list => [...list, { id: result.id!, kind, body, user_id: userId ?? '', up: 0, down: 0 }]);
    });
  };

  const remove = (id: string) => {
    setPoints(list => list.filter(p => p.id !== id));
    startTransition(async () => { await deletePoint(id); });
  };

  const column = (kind: 'pro' | 'con') => {
    const items = points.filter(p => p.kind === kind);
    const Icon = kind === 'pro' ? Check : AlertTriangle;
    return (
      <section className="rounded-2xl border border-line bg-white p-5" aria-label={kind === 'pro' ? c.pros : c.cons}>
        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-wine-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {kind === 'pro' ? c.pros : c.cons}
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-smoke">{c.none}</p>
        ) : (
          <ul className="space-y-3">
            {items.map(p => {
              const v = myVote(p.id);
              return (
                <li key={p.id} className="flex items-start gap-3">
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      disabled={!userId || pending}
                      aria-pressed={v === 1}
                      aria-label={`+1: ${p.body}`}
                      onClick={() => vote(p, 1)}
                      className={`flex flex-col items-center text-[11px] leading-tight transition disabled:cursor-default ${v === 1 ? 'font-bold text-wine-700' : 'text-smoke enabled:hover:text-wine-600'}`}
                    >
                      <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                      <span dir="ltr">{p.up}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!userId || pending}
                      aria-pressed={v === -1}
                      aria-label={`-1: ${p.body}`}
                      onClick={() => vote(p, -1)}
                      className={`flex flex-col items-center text-[11px] leading-tight transition disabled:cursor-default ${v === -1 ? 'font-bold text-wine-700' : 'text-smoke enabled:hover:text-wine-600'}`}
                    >
                      <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                      <span dir="ltr">{p.down}</span>
                    </button>
                  </div>
                  <p className="min-w-0 flex-1 break-words text-sm text-ink">{p.body}</p>
                  {userId && p.user_id === userId && (
                    <button type="button" onClick={() => remove(p.id)} aria-label={c.remove} className="shrink-0 text-smoke transition hover:text-wine-700">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {userId && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={e => { e.preventDefault(); add(kind); }}
          >
            <input
              value={drafts[kind]}
              onChange={e => setDrafts(d => ({ ...d, [kind]: e.target.value }))}
              maxLength={140}
              placeholder={kind === 'pro' ? c.addPro : c.addCon}
              aria-label={`${kind === 'pro' ? c.addPro : c.addCon} - ${c.placeholder}`}
              className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-wine-600"
            />
            <button
              type="submit"
              disabled={pending || drafts[kind].trim().length < 3}
              className="rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-50"
            >
              {c.add}
            </button>
          </form>
        )}
      </section>
    );
  };

  return (
    <section className="mt-14" aria-labelledby="points-heading">
      <h2 id="points-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">{c.heading}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {column('pro')}
        {column('con')}
      </div>
      {ready && !userId && (
        <p className="mt-3 text-sm">
          <Link href={withLang(lang, '/login')} className="font-bold text-wine-600 underline underline-offset-4">{t.community.panels.loginToVote}</Link>
        </p>
      )}
      {message && <p className="mt-2 text-sm font-medium text-wine-700" role="status">{message}</p>}
      <p className="mt-3 text-xs text-smoke">{c.note}</p>
    </section>
  );
}
