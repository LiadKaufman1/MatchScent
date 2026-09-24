import { getSupabase } from './supabase';
import { slugify } from './slug';
import {
  ASPECTS,
  isVoteKind,
  type PerfumeCommunity,
  type PointRow,
  type ReviewWithAuthor,
} from './community-types';

// Votes on an "inspired by" fragrance belong to the perfume + this key (not to the row id),
// so re-importing the lists never wipes the visitors' votes.
export const entryKey = (brand: string, name: string) => slugify(`${brand} ${name}`);

export const emptyCommunity = (): PerfumeCommunity => ({
  average: 0,
  count: 0,
  ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  aspects: { scent: null, bottle: null },
  votes: {},
  points: [],
  reviews: [],
  entryVotes: {},
  shelf: { own: 0, had: 0, want: 0 },
});

type Supa = ReturnType<typeof getSupabase>;
const one = <T,>(x: T | T[] | null | undefined): T | undefined => (Array.isArray(x) ? x[0] : x ?? undefined);

// Community data for one perfume: ratings, the Fragrantica-style vote panels, pros/cons,
// reviews (with "helpful" counts), votes on the "inspired by" entries, and how many people
// have it on their shelf. All of it is public data (same for every visitor), so it is safe to
// bake into a static/ISR page - unlike "did THIS visitor already vote", which belongs
// client-side, never here.
//
// These tables/columns are added by the owner-run migrations in db-migrations/. A missing one
// must not break the page - each part below falls back to "nothing yet" on its own.
export async function getPerfumeCommunity(perfumeId: string): Promise<PerfumeCommunity> {
  const result = emptyCommunity();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return result;
  const supabase = getSupabase();

  await Promise.all([
    loadRatings(supabase, perfumeId, result),
    loadVotes(supabase, perfumeId, result),
    loadPoints(supabase, perfumeId, result),
    loadReviews(supabase, perfumeId, result),
    loadEntryVotes(supabase, perfumeId, result),
    loadShelf(supabase, perfumeId, result),
  ]);
  return result;
}

async function loadRatings(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    type RatingRow = { score: number } & Partial<Record<(typeof ASPECTS)[number], number | null>>;
    let rows: RatingRow[] | null = null;
    const wide = await supabase.from('ratings').select('score, scent, bottle').eq('perfume_id', perfumeId);
    if (!wide.error) rows = wide.data as RatingRow[];
    else {
      const narrow = await supabase.from('ratings').select('score').eq('perfume_id', perfumeId);
      if (!narrow.error) rows = narrow.data as RatingRow[];
    }
    if (!rows?.length) return;
    result.count = rows.length;
    result.average = rows.reduce((sum, r) => sum + r.score, 0) / rows.length;
    for (const r of rows) result.ratingCounts[r.score] = (result.ratingCounts[r.score] ?? 0) + 1;
    for (const aspect of ASPECTS) {
      const values = rows.map(r => r[aspect]).filter((v): v is number => typeof v === 'number');
      if (values.length) result.aspects[aspect] = { average: values.reduce((a, b) => a + b, 0) / values.length, count: values.length };
    }
  } catch { /* keep the empty ratings */ }
}

async function loadVotes(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    const { data, error } = await supabase.from('perfume_votes').select('kind, value').eq('perfume_id', perfumeId);
    if (error) return;
    for (const row of (data ?? []) as { kind: string; value: number }[]) {
      if (!isVoteKind(row.kind)) continue;
      const bucket = (result.votes[row.kind] ??= {});
      bucket[row.value] = (bucket[row.value] ?? 0) + 1;
    }
  } catch { /* keep no votes */ }
}

async function loadPoints(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    const { data, error } = await supabase
      .from('perfume_points')
      .select('id, kind, body, user_id, point_votes(vote)')
      .eq('perfume_id', perfumeId)
      .limit(200);
    if (error) return;
    type Row = { id: string; kind: 'pro' | 'con'; body: string; user_id: string; point_votes: { vote: number }[] | null };
    const points: PointRow[] = ((data ?? []) as Row[]).map(r => ({
      id: r.id,
      kind: r.kind,
      body: r.body,
      user_id: r.user_id,
      up: (r.point_votes ?? []).filter(v => v.vote > 0).length,
      down: (r.point_votes ?? []).filter(v => v.vote < 0).length,
    }));
    // The most agreed-with points first.
    result.points = points.sort((a, b) => b.up - b.down - (a.up - a.down));
  } catch { /* keep no points */ }
}

async function loadReviews(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    type ReviewRow = {
      id: string; body: string; created_at: string; user_id: string;
      author: { display_name: string } | { display_name: string }[] | null;
      review_votes?: { user_id: string }[] | null;
    };
    // "review_votes" exists only after the v3 migration; without it, ask again without the counts.
    let rows: ReviewRow[] | null = null;
    const withVotes = await supabase
      .from('reviews')
      .select('id, body, created_at, user_id, author:profiles(display_name), review_votes(user_id)')
      .eq('perfume_id', perfumeId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!withVotes.error) rows = withVotes.data as ReviewRow[];
    else {
      const plain = await supabase
        .from('reviews')
        .select('id, body, created_at, user_id, author:profiles(display_name)')
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!plain.error) rows = plain.data as ReviewRow[];
    }
    const reviews: ReviewWithAuthor[] = (rows ?? []).map(r => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      user_id: r.user_id,
      author: one(r.author)?.display_name ?? '',
      helpful: r.review_votes?.length ?? 0,
    }));
    result.reviews = reviews.sort((a, b) => b.helpful - a.helpful || b.created_at.localeCompare(a.created_at));
  } catch { /* keep no reviews */ }
}

async function loadEntryVotes(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    const { data, error } = await supabase.from('entry_votes').select('entry_key, vote').eq('perfume_id', perfumeId);
    if (error) return;
    for (const row of (data ?? []) as { entry_key: string; vote: number }[]) {
      const counts = (result.entryVotes[row.entry_key] ??= { up: 0, down: 0 });
      if (row.vote > 0) counts.up++; else counts.down++;
    }
  } catch { /* keep no votes */ }
}

async function loadShelf(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    const { data, error } = await supabase.from('collections').select('status').eq('perfume_id', perfumeId);
    if (error) return;
    for (const row of (data ?? []) as { status: 'own' | 'had' | 'want' }[]) result.shelf[row.status]++;
  } catch { /* keep an empty shelf */ }
}
