'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { setShelf } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { useLatestSender } from '@/lib/use-latest-sender';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';

type Status = 'own' | 'had' | 'want';

// "I own it / I had it / I want it" - the visitor's own shelf, plus how many people
// keep this perfume on theirs.
export default function ShelfButtons({ lang, perfumeId, own, want }: { lang: Lang; perfumeId: string; own: number; want: number }) {
  const t = getDict(lang);
  const { ready, userId } = useViewer();
  const [savedStatus, setMine] = useState<Status | null>(null);
  const [counts, setCounts] = useState({ own, want });
  const send = useLatestSender();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const { data } = await getSupabaseBrowser()
        .from('collections')
        .select('status')
        .eq('perfume_id', perfumeId)
        .eq('user_id', userId)
        .maybeSingle();
      if (active) setMine((data?.status as Status | undefined) ?? null);
    })();
    return () => { active = false; };
  }, [perfumeId, userId]);

  const mine = userId ? savedStatus : null; // after logging out, nothing of theirs is shown

  const choose = (status: Status) => {
    const next = mine === status ? null : status;
    setCounts(c => ({
      own: c.own + (next === 'own' ? 1 : 0) - (mine === 'own' ? 1 : 0),
      want: c.want + (next === 'want' ? 1 : 0) - (mine === 'want' ? 1 : 0),
    }));
    setMine(next);
    send('shelf', next, v => setShelf(perfumeId, v));
  };

  const options: [Status, string][] = [['own', t.community.shelfOwn], ['had', t.community.shelfHad], ['want', t.community.shelfWant]];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.community.shelfHeading}>
        {options.map(([status, label]) => (
          <button
            key={status}
            type="button"
            disabled={!userId}
            aria-pressed={mine === status}
            onClick={() => choose(status)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition disabled:cursor-default ${
              mine === status ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white text-smoke enabled:hover:border-wine-600/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {(counts.own > 0 || counts.want > 0) && (
        <p className="mt-2 text-xs text-smoke">{fmt(t.community.shelfCounts, { own: counts.own, want: counts.want })}</p>
      )}
      {ready && !userId && (
        <Link href={withLang(lang, '/login')} className="mt-2 inline-block text-xs font-bold text-wine-600 underline underline-offset-4">
          {t.community.shelfLogin}
        </Link>
      )}
    </div>
  );
}
