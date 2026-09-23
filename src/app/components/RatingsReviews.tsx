'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { submitRating, submitReview } from '@/lib/community-actions';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import type { ReviewWithAuthor } from '@/lib/load-catalog';

type Props = { lang: Lang; perfumeId: string; average: number; count: number; reviews: ReviewWithAuthor[] };

// The average/review list come from the server (public, same for every visitor, part of
// the static page). Whether THIS visitor is logged in, and their own rating, are read
// here in the browser instead - that is per-visitor data and must never end up baked
// into a page that everyone shares.
export default function RatingsReviews({ lang, perfumeId, average, count, reviews: initialReviews }: Props) {
  const t = getDict(lang);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [myName, setMyName] = useState('');
  const [myScore, setMyScore] = useState<number | null>(null);
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewText, setReviewText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowser();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setLoggedIn(!!user);
      if (!user) return;

      const [{ data: rating }, { data: profile }] = await Promise.all([
        supabase.from('ratings').select('score').eq('perfume_id', perfumeId).eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('display_name').eq('id', user.id).single(),
      ]);
      if (!active) return;
      setMyScore(rating?.score ?? null);
      setMyName(profile?.display_name ?? '');
    })();
    return () => { active = false; };
  }, [perfumeId]);

  const rate = (score: number) => {
    setMyScore(score); // optimistic - the real average catches up after the page next revalidates
    startTransition(async () => {
      const result = await submitRating(perfumeId, score);
      setMessage(result.success ? t.community.thanks : t.auth.errorGeneric);
    });
  };

  const sendReview = () => {
    const body = reviewText.trim();
    startTransition(async () => {
      const result = await submitReview(perfumeId, body);
      if (!result.success) { setMessage(t.auth.errorGeneric); return; }
      setMessage(t.community.thanks);
      setReviewText('');
      // Show it immediately instead of waiting for the next page revalidation.
      setReviews(prev => [{ id: `mine-${Date.now()}`, body, created_at: new Date().toISOString(), author: myName }, ...prev.filter(r => r.author !== myName)]);
    });
  };

  return (
    <section className="mt-14" aria-labelledby="community-heading">
      <h2 id="community-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
        {t.community.ratingsHeading}
      </h2>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-bold text-ink">
          {count > 0 ? fmt(t.community.ratingSummary, { avg: average.toFixed(1), count }) : t.community.ratingNone}
        </p>

        {loggedIn === false && (
          <p className="mt-3 text-sm text-smoke">
            <Link href={withLang(lang, '/login')} className="font-bold text-wine-600 underline underline-offset-4">
              {t.community.loginToParticipate}
            </Link>
          </p>
        )}

        {loggedIn && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.community.yourRating}</p>
            <div className="flex gap-1" role="radiogroup" aria-label={t.community.yourRating}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={myScore === n}
                  disabled={pending}
                  onClick={() => rate(n)}
                  className={`h-9 w-9 rounded-full border text-sm font-bold transition ${
                    myScore !== null && n <= myScore
                      ? 'border-wine-600 bg-wine-600 text-white'
                      : 'border-line bg-white text-smoke hover:border-wine-600/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <label className="mt-6 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.community.reviewsHeading}</span>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder={t.community.reviewPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-wine-600"
              />
            </label>
            <button
              type="button"
              disabled={pending || reviewText.trim().length < 10}
              onClick={sendReview}
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
              <p className="text-sm font-bold text-ink">{r.author}</p>
              <p className="mt-1.5 leading-relaxed text-smoke">{r.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
