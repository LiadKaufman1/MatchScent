import { cache } from 'react';
import { getSupabase } from './supabase';
import { getCatalog, type ShownPerfume } from './load-catalog';

// Community numbers for the home page and the /top charts. All public data, read with the anon
// key and baked into the (ISR) pages; community actions refresh those pages right away.
// Every table here comes from an owner-run migration: a missing one just means "nothing yet".

export type RankedPerfume = { perfume: ShownPerfume; n: number; avg?: number };
export type LatestReview = { id: string; body: string; created_at: string; author: string; user_id: string; perfume: ShownPerfume };
export type LatestPhoto = { id: string; url: string; author: string; user_id: string; perfume: ShownPerfume };
export type ActiveMember = { user_id: string; name: string; ratings: number; reviews: number };
export type Overview = {
  topRated: RankedPerfume[];
  mostLoved: RankedPerfume[];
  mostWanted: RankedPerfume[];
  mostOwned: RankedPerfume[];
  mostReviewed: RankedPerfume[];
  latestReviews: LatestReview[];
  latestPhotos: LatestPhoto[];
  topMembers: ActiveMember[];
};

const empty = (): Overview => ({
  topRated: [], mostLoved: [], mostWanted: [], mostOwned: [], mostReviewed: [], latestReviews: [], latestPhotos: [], topMembers: [],
});

type Author = { display_name: string } | { display_name: string }[] | null;
const authorName = (a: Author) => (Array.isArray(a) ? a[0]?.display_name : a?.display_name) ?? '';

// Supabase returns at most 1000 rows per request, so read in pages. Returns [] if the table is missing.
async function readAll<T>(table: string, columns: string): Promise<T[]> {
  const supabase = getSupabase();
  const rows: T[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order('id').range(from, from + 999);
    if (error) return rows;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const countBy = <T,>(rows: T[], key: (r: T) => string | null) => {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return m;
};

async function loadOverview(limit = 20): Promise<Overview> {
  const result = empty();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return result;

  const { perfumes } = await getCatalog();
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const supabase = getSupabase();

  try {
    const [ratings, shelf, reviewRows, latest, photos] = await Promise.all([
      readAll<{ perfume_id: string; user_id: string; score: number }>('ratings', 'perfume_id, user_id, score'),
      readAll<{ perfume_id: string; status: string }>('collections', 'perfume_id, status'),
      readAll<{ perfume_id: string; user_id: string }>('reviews', 'perfume_id, user_id'),
      supabase.from('reviews').select('id, body, created_at, user_id, perfume_id, author:profiles(display_name)').order('created_at', { ascending: false }).limit(12),
      supabase.from('perfume_photos').select('id, public_url, user_id, perfume_id, author:profiles(display_name)').eq('status', 'approved').order('created_at', { ascending: false }).limit(12),
    ]);

    const rank = (counts: Map<string, number>): RankedPerfume[] =>
      [...counts]
        .map(([id, n]) => ({ perfume: byId.get(id), n }))
        .filter((x): x is RankedPerfume => !!x.perfume && x.n > 0)
        .sort((a, b) => b.n - a.n || a.perfume.name.localeCompare(b.perfume.name))
        .slice(0, limit);

    // Top rated: a "Bayesian" average, so one single 5-star vote does not beat 40 votes averaging 4.6.
    const sums = new Map<string, { sum: number; n: number }>();
    for (const r of ratings) {
      const s = sums.get(r.perfume_id) ?? { sum: 0, n: 0 };
      s.sum += r.score; s.n++;
      sums.set(r.perfume_id, s);
    }
    const globalMean = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : 0;
    const PRIOR = 3;
    result.topRated = [...sums]
      .map(([id, s]) => ({ perfume: byId.get(id), n: s.n, avg: s.sum / s.n, score: (PRIOR * globalMean + s.sum) / (PRIOR + s.n) }))
      .filter(x => !!x.perfume)
      .sort((a, b) => b.score - a.score || b.n - a.n)
      .slice(0, limit)
      .map(({ perfume, n, avg }) => ({ perfume: perfume!, n, avg }));

    result.mostLoved = rank(countBy(ratings.filter(r => r.score === 5), r => r.perfume_id));
    result.mostWanted = rank(countBy(shelf.filter(r => r.status === 'want'), r => r.perfume_id));
    result.mostOwned = rank(countBy(shelf.filter(r => r.status === 'own'), r => r.perfume_id));
    result.mostReviewed = rank(countBy(reviewRows, r => r.perfume_id));

    if (!latest.error) {
      type Row = { id: string; body: string; created_at: string; user_id: string; perfume_id: string; author: Author };
      result.latestReviews = ((latest.data ?? []) as Row[])
        .map(r => ({ ...r, author: authorName(r.author), perfume: byId.get(r.perfume_id) }))
        .filter((r): r is LatestReview & { perfume_id: string } => !!r.perfume)
        .map(({ id, body, created_at, author, user_id, perfume }) => ({ id, body, created_at, author, user_id, perfume }));
    }
    if (!photos.error) {
      type Row = { id: string; public_url: string | null; user_id: string; perfume_id: string; author: Author };
      result.latestPhotos = ((photos.data ?? []) as Row[])
        .filter(r => r.public_url && byId.get(r.perfume_id))
        .map(r => ({ id: r.id, url: r.public_url as string, author: authorName(r.author), user_id: r.user_id, perfume: byId.get(r.perfume_id)! }));
    }

    // Most active members: ratings + reviews.
    const ratingsBy = countBy(ratings, r => r.user_id);
    const reviewsBy = countBy(reviewRows, r => r.user_id);
    const members = [...new Set([...ratingsBy.keys(), ...reviewsBy.keys()])]
      .map(id => ({ user_id: id, ratings: ratingsBy.get(id) ?? 0, reviews: reviewsBy.get(id) ?? 0 }))
      .sort((a, b) => b.ratings + b.reviews * 3 - (a.ratings + a.reviews * 3))
      .slice(0, 10);
    if (members.length) {
      const { data } = await supabase.from('profiles').select('id, display_name').in('id', members.map(m => m.user_id));
      const names = new Map(((data ?? []) as { id: string; display_name: string }[]).map(p => [p.id, p.display_name]));
      result.topMembers = members.map(m => ({ ...m, name: names.get(m.user_id) ?? '' })).filter(m => m.name);
    }
  } catch {
    // keep whatever was filled in; the pages show only non-empty sections
  }
  return result;
}

// Within one page render, read it only once.
export const getOverview = cache(() => loadOverview());
