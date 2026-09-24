'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ThumbsUp } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { markReviewHelpful, submitReview } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import type { ReviewWithAuthor } from '@/lib/community-types';

// Written reviews: the list comes from the server (public, part of the static page); whether
// THIS visitor is logged in, their name, and which reviews they found helpful are read here.
export default function Reviews({ lang, perfumeId, reviews: initial }: { lang: Lang; perfumeId: string; reviews: ReviewWithAuthor[] }) {
  const t = getDict(lang);
  const { ready, userId } = useViewer();
  const [myName, setMyName] = useState('');
  const [reviews, setReviews] = useState(initial);
  const [helpedByMe, setHelpedByMe] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const supabase = getSupabaseBrowser();
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
      const ids = initial.map(r => r.id);
      const { data: votes } = ids.length
        ? await supabase.from('review_votes').select('review_id').eq('user_id', userId).in('review_id', ids)
        : { data: [] };
      if (!active) return;
      setMyName(profile?.display_name ?? '');
      setHelpedByMe(Object.fromEntries(((votes ?? []) as { review_id: string }[]).map(v => [v.review_id, true])));
    })();
    return () => { active = false; };
  }, [userId, initial]);

  const send = () => {
    const body = text.trim();
    startTransition(async () => {
      const result = await submitReview(perfumeId, body);
      if (!result.success) { setMessage(t.auth.errorGeneric); return; }
      setMessage(t.community.thanks);
      setText('');
      // Show it immediately instead of waiting for the next page revalidation.
      setReviews(prev => [{ id: `mine-${Date.now()}`, body, created_at: new Date().toISOString(), author: myName, user_id: userId ?? '', helpful: 0 }, ...prev.filter(r => r.user_id !== userId)]);
    });
  };

  const helpful = (review: ReviewWithAuthor) => {
    if (review.id.startsWith('mine-')) return;
    const on = !helpedByMe[review.id];
    setHelpedByMe(m => ({ ...m, [review.id]: on }));
    setReviews(list => list.map(r => (r.id === review.id ? { ...r, helpful: Math.max(0, r.helpful + (on ? 1 : -1)) } : r)));
    startTransition(async () => { await markReviewHelpful(review.id, on); });
  };

  return (
    <section className="mt-14" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
        {t.community.reviewsHeading} {reviews.length > 0 && <span className="text-smoke" dir="ltr">({reviews.length})</span>}
      </h2>

      <div className="rounded-2xl border border-line bg-white p-5">
        {ready && !userId && (
          <p className="text-sm text-smoke">
            <Link href={withLang(lang, '/login')} className="font-bold text-wine-600 underline underline-offset-4">{t.community.loginToParticipate}</Link>
          </p>
        )}
        {userId && (
          <div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t.community.reviewPlaceholder}
              aria-label={t.community.reviewsHeading}
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-wine-600"
            />
            <button
              type="button"
              disabled={pending || text.trim().length < 10}
              onClick={send}
              className="mt-2 rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-50"
            >
              {t.community.reviewSubmit}
            </button>
          </div>
        )}
        {message && <p className="mt-3 text-sm font-medium text-wine-700" role="status">{message}</p>}
      </div>

      <div className="mt-5 space-y-3">
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white py-8 text-center text-smoke">{t.community.reviewNone}</p>
        ) : (
          reviews.map(r => (
            <article key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-sm font-bold text-ink">
                {r.user_id ? (
                  <Link href={withLang(lang, `/u/${r.user_id}`)} prefetch={false} className="transition hover:text-wine-600">{r.author}</Link>
                ) : r.author}
              </p>
              <p className="mt-1.5 whitespace-pre-line leading-relaxed text-smoke">{r.body}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-smoke">
                <button
                  type="button"
                  disabled={!userId || pending || r.user_id === userId}
                  aria-pressed={!!helpedByMe[r.id]}
                  onClick={() => helpful(r)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold transition disabled:cursor-default ${
                    helpedByMe[r.id] ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white enabled:hover:border-wine-600/60'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.community.helpful}
                </button>
                {r.helpful > 0 && <span>{fmt(t.community.helpfulCount, { n: r.helpful })}</span>}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
