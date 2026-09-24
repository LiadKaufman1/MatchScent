'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { voteEntry } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { useLatestSender } from '@/lib/use-latest-sender';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';

// This visitor's votes on one perfume's entries: read once and shared by all its cards.
const myVotesCache = new Map<string, Promise<Record<string, number>>>();
function loadMyVotes(perfumeId: string, userId: string) {
  const key = `${perfumeId}:${userId}`;
  let promise = myVotesCache.get(key);
  if (!promise) {
    promise = (async () => {
      const { data } = await getSupabaseBrowser()
        .from('entry_votes')
        .select('entry_key, vote')
        .eq('perfume_id', perfumeId)
        .eq('user_id', userId);
      return Object.fromEntries(((data ?? []) as { entry_key: string; vote: number }[]).map(r => [r.entry_key, r.vote]));
    })();
    myVotesCache.set(key, promise);
  }
  return promise;
}

// "Does it smell like the original?" - the community's answer, for one "inspired by" entry.
export default function EntryVotes({ lang, perfumeId, entryKey, up, down }: {
  lang: Lang; perfumeId: string; entryKey: string; up: number; down: number;
}) {
  const t = getDict(lang);
  const { ready, userId } = useViewer();
  const [savedVote, setMine] = useState<-1 | 0 | 1>(0);
  const [shown, setShown] = useState({ up, down });
  const send = useLatestSender();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    loadMyVotes(perfumeId, userId).then(votes => { if (active) setMine((votes[entryKey] as -1 | 0 | 1) ?? 0); });
    return () => { active = false; };
  }, [perfumeId, entryKey, userId]);

  useEffect(() => setShown({ up, down }), [up, down]);

  const mine = userId ? savedVote : 0; // after logging out, nothing of theirs is shown

  // The numbers from the server already include this visitor's saved vote; adjust them by
  // what changed in this session so the buttons react at once.
  const choose = (vote: -1 | 1) => {
    const next = mine === vote ? 0 : vote;
    setShown(s => ({
      up: s.up + (next === 1 ? 1 : 0) - (mine === 1 ? 1 : 0),
      down: s.down + (next === -1 ? 1 : 0) - (mine === -1 ? 1 : 0),
    }));
    setMine(next);
    if (userId) myVotesCache.delete(`${perfumeId}:${userId}`);
    send('vote', next as -1 | 0 | 1, v => voteEntry(perfumeId, entryKey, v));
  };

  const total = shown.up + shown.down;
  const button = (vote: -1 | 1, label: string, Icon: typeof ThumbsUp) => (
    <button
      type="button"
      disabled={!userId}
      aria-pressed={mine === vote}
      onClick={() => choose(vote)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition disabled:cursor-default ${
        mine === vote ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white text-smoke enabled:hover:border-wine-600/60'
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-xs font-bold text-ink">{t.community.entryVoteQuestion}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {button(1, t.community.entryVoteYes, ThumbsUp)}
        {button(-1, t.community.entryVoteNo, ThumbsDown)}
        <span className="text-xs text-smoke">
          {total === 0 ? t.community.entryVoteNone : fmt(t.community.entryVoteSummary, { up: shown.up, total })}
        </span>
      </div>
      {ready && !userId && (
        <Link href={withLang(lang, '/login')} className="mt-1.5 inline-block text-xs font-bold text-wine-600 underline underline-offset-4">
          {t.community.entryVoteLogin}
        </Link>
      )}
    </div>
  );
}
