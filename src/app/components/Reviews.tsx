'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { MessageCircle, ThumbsUp, Trash2 } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { addComment, deleteComment, markReviewHelpful, submitReview } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import type { CommentRow, ReviewWithAuthor } from '@/lib/community-types';

type Dict = ReturnType<typeof getDict>;
const errorText = (t: Dict, error: string) => (error === 'blocked word' ? t.community.blockedWord : t.auth.errorGeneric);

const authorLink = (lang: Lang, userId: string, name: string) =>
  userId ? (
    <Link href={withLang(lang, `/u/${userId}`)} prefetch={false} className="transition hover:text-wine-600">{name}</Link>
  ) : name;

// Replies under one review: collapsed by default, shows the count; members can add their own and
// delete their own.
function Comments({ lang, reviewId, initial, userId, myName }: {
  lang: Lang; reviewId: string; initial: CommentRow[]; userId: string | null; myName: string;
}) {
  const t = getDict(lang);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canReply = !!userId && !reviewId.startsWith('mine-');

  const send = () => {
    const body = text.trim();
    startTransition(async () => {
      const result = await addComment(reviewId, body);
      if (!result.success || !result.id) { setError(errorText(t, result.success ? '' : result.error)); return; }
      setError(null);
      setText('');
      setComments(list => [...list, { id: result.id!, body, created_at: new Date().toISOString(), author: myName, user_id: userId ?? '' }]);
    });
  };

  const remove = (id: string) => {
    setComments(list => list.filter(c => c.id !== id));
    startTransition(async () => { await deleteComment(id); });
  };

  if (!open) {
    if (comments.length === 0 && !canReply) return null;
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 font-bold text-smoke transition hover:text-wine-600">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {comments.length > 0 ? fmt(t.comments.show, { n: comments.length }) : t.comments.reply}
      </button>
    );
  }

  return (
    <div className="mt-3 w-full border-s-2 border-line ps-4">
      {comments.length > 0 && (
        <ul className="space-y-2.5">
          {comments.map(c => (
            <li key={c.id} className="text-sm">
              <span className="font-bold text-ink">{authorLink(lang, c.user_id, c.author)}</span>
              <p className="whitespace-pre-line text-smoke">{c.body}</p>
              {userId && c.user_id === userId && (
                <button type="button" onClick={() => remove(c.id)} className="mt-0.5 inline-flex items-center gap-1 text-xs text-smoke hover:text-wine-700">
                  <Trash2 className="h-3 w-3" aria-hidden="true" />{t.comments.remove}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canReply && (
        <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={1000}
            placeholder={t.comments.placeholder}
            aria-label={t.comments.placeholder}
            className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-wine-600"
          />
          <button type="submit" disabled={pending || text.trim().length < 2} className="rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-50">
            {t.comments.submit}
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-xs font-medium text-wine-700" role="status">{error}</p>}
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-xs font-bold text-smoke hover:text-wine-600">{t.comments.hide}</button>
    </div>
  );
}

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
      if (!result.success) { setMessage(errorText(t, result.error)); return; }
      setMessage(t.community.thanks);
      setText('');
      // Show it immediately instead of waiting for the next page revalidation.
      setReviews(prev => [
        { id: `mine-${Date.now()}`, body, created_at: new Date().toISOString(), author: myName, user_id: userId ?? '', helpful: 0, comments: [] },
        ...prev.filter(r => r.user_id !== userId),
      ]);
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
              <p className="text-sm font-bold text-ink">{authorLink(lang, r.user_id, r.author)}</p>
              <p className="mt-1.5 whitespace-pre-line leading-relaxed text-smoke">{r.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-smoke">
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
                <Comments lang={lang} reviewId={r.id} initial={r.comments} userId={userId} myName={myName} />
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
