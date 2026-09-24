'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { submitRating, submitReview, type RatingDetails } from '@/lib/community-actions';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import { ASPECTS, type Aspect, type PerfumeCommunity, type ReviewWithAuthor } from '@/lib/community-types';

type Props = {
  lang: Lang;
  perfumeId: string;
  average: number;
  count: number;
  aspects: PerfumeCommunity['aspects'];
  reviews: ReviewWithAuthor[];
};

const aspectLabel = (t: ReturnType<typeof getDict>, a: Aspect) =>
  ({ scent: t.community.aspectScent, longevity: t.community.aspectLongevity, sillage: t.community.aspectSillage, bottle: t.community.aspectBottle, value: t.community.aspectValue })[a];

// 1-5 buttons in a row.
function Stars({ label, value, disabled, small, onPick }: { label: string; value: number | null; disabled: boolean; small?: boolean; onPick: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          disabled={disabled}
          onClick={() => onPick(n)}
          className={`${small ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'} rounded-full border font-bold transition ${
            value !== null && n <= value
              ? 'border-wine-600 bg-wine-600 text-white'
              : 'border-line bg-white text-smoke hover:border-wine-600/60'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// The average/review list come from the server (public, same for every visitor, part of
// the static page). Whether THIS visitor is logged in, and their own rating, are read
// here in the browser instead - that is per-visitor data and must never end up baked
// into a page that everyone shares.
export default function RatingsReviews({ lang, perfumeId, average, count, aspects, reviews: initialReviews }: Props) {
  const t = getDict(lang);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [myName, setMyName] = useState('');
  const [myUserId, setMyUserId] = useState('');
  const [myScore, setMyScore] = useState<number | null>(null);
  const [myDetails, setMyDetails] = useState<RatingDetails>({});
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

      // The detail columns exist only after the owner ran the community-v2 migration; without
      // them the wide query errors, so fall back to the overall score alone.
      const wide = await supabase.from('ratings').select('score, scent, longevity, sillage, bottle, value').eq('perfume_id', perfumeId).eq('user_id', user.id).maybeSingle();
      const rating = wide.error
        ? (await supabase.from('ratings').select('score').eq('perfume_id', perfumeId).eq('user_id', user.id).maybeSingle()).data
        : wide.data;
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      if (!active) return;
      setMyUserId(user.id);
      setMyScore(rating?.score ?? null);
      setMyDetails(Object.fromEntries(ASPECTS.map(a => [a, (rating as RatingDetails | null)?.[a] ?? null])));
      setMyName(profile?.display_name ?? '');
    })();
    return () => { active = false; };
  }, [perfumeId]);

  const save = (score: number, details: RatingDetails) => {
    setMyScore(score); // optimistic - the real average catches up after the page next revalidates
    setMyDetails(details);
    startTransition(async () => {
      const result = await submitRating(perfumeId, score, details);
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
      setReviews(prev => [{ id: `mine-${Date.now()}`, body, created_at: new Date().toISOString(), author: myName, user_id: myUserId }, ...prev.filter(r => r.user_id !== myUserId)]);
    });
  };

  const shownAspects = ASPECTS.filter(a => aspects[a]);

  return (
    <section className="mt-14" aria-labelledby="community-heading">
      <h2 id="community-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
        {t.community.ratingsHeading}
      </h2>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-bold text-ink">
          {count === 0
            ? t.community.ratingNone
            : fmt(count === 1 ? t.community.ratingSummaryOne : t.community.ratingSummary, { avg: average.toFixed(1), count })}
        </p>

        {shownAspects.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.community.breakdownHeading}</p>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {shownAspects.map(a => {
                const info = aspects[a]!;
                return (
                  <div key={a}>
                    <dt className="flex justify-between text-sm text-ink">
                      <span>{aspectLabel(t, a)}</span>
                      <span className="font-bold" dir="ltr">{info.average.toFixed(1)}</span>
                    </dt>
                    <dd className="mt-1 h-1.5 overflow-hidden rounded-full bg-blush">
                      <div className="h-full rounded-full bg-wine-600" style={{ width: `${(info.average / 5) * 100}%` }} />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}

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
            <Stars label={t.community.yourRating} value={myScore} disabled={pending} onPick={n => save(n, myDetails)} />

            {myScore !== null && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-smoke">{t.community.aspectsHint}</p>
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {ASPECTS.map(a => (
                    <div key={a}>
                      <p className="mb-1 text-sm text-ink">{aspectLabel(t, a)}</p>
                      <Stars small label={aspectLabel(t, a)} value={myDetails[a] ?? null} disabled={pending} onPick={n => save(myScore, { ...myDetails, [a]: n })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <p className="text-sm font-bold text-ink">
                {r.user_id ? (
                  <Link href={withLang(lang, `/u/${r.user_id}`)} prefetch={false} className="transition hover:text-wine-600">{r.author}</Link>
                ) : r.author}
              </p>
              <p className="mt-1.5 leading-relaxed text-smoke">{r.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
