import { getSupabase } from './supabase';
import { slugify } from './slug';
import {
  ASPECTS,
  isVoteKind,
  type PerfumeCommunity,
  type CommentRow,
  type PhotoRow,
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
  noteVotes: {},
  photos: [],
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
    loadNoteVotes(supabase, perfumeId, result),
    loadPhotos(supabase, perfumeId, result),
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
    type Author = { display_name: string } | { display_name: string }[] | null;
    type ReviewRow = { id: string; body: string; created_at: string; user_id: string; author: Author };
    const { data, error } = await supabase
      .from('reviews')
      .select('id, body, created_at, user_id, author:profiles(display_name)')
      .eq('perfume_id', perfumeId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return;
    const rows = (data ?? []) as ReviewRow[];
    const ids = rows.map(r => r.id);

    // "Helpful" votes (v3) and comments (v4) live in their own tables; if one is not there yet,
    // its part simply stays empty.
    const helpful = new Map<string, number>();
    const comments = new Map<string, CommentRow[]>();
    const scores = new Map<string, number>(); // the author's own rating of this perfume, shown next to the review
    if (ids.length) {
      const [votes, replies, authorRatings] = await Promise.all([
        supabase.from('review_votes').select('review_id').in('review_id', ids),
        supabase
          .from('review_comments')
          .select('id, review_id, body, created_at, user_id, author:profiles(display_name)')
          .in('review_id', ids)
          .order('created_at', { ascending: true }),
        supabase.from('ratings').select('user_id, score').eq('perfume_id', perfumeId).in('user_id', [...new Set(rows.map(r => r.user_id))]),
      ]);
      if (!authorRatings.error) for (const r of (authorRatings.data ?? []) as { user_id: string; score: number }[]) scores.set(r.user_id, r.score);
      if (!votes.error) for (const v of (votes.data ?? []) as { review_id: string }[]) helpful.set(v.review_id, (helpful.get(v.review_id) ?? 0) + 1);
      if (!replies.error) {
        type CommentDbRow = { id: string; review_id: string; body: string; created_at: string; user_id: string; author: Author };
        for (const c of (replies.data ?? []) as CommentDbRow[]) {
          const list = comments.get(c.review_id) ?? [];
          list.push({ id: c.id, body: c.body, created_at: c.created_at, user_id: c.user_id, author: one(c.author)?.display_name ?? '' });
          comments.set(c.review_id, list);
        }
      }
    }

    const reviews: ReviewWithAuthor[] = rows.map(r => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      user_id: r.user_id,
      author: one(r.author)?.display_name ?? '',
      helpful: helpful.get(r.id) ?? 0,
      comments: comments.get(r.id) ?? [],
      score: scores.get(r.user_id) ?? null,
    }));
    result.reviews = reviews.sort((x, y) => y.helpful - x.helpful || y.created_at.localeCompare(x.created_at));
  } catch { /* keep no reviews */ }
}

async function loadNoteVotes(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    const { data, error } = await supabase.from('note_votes').select('note').eq('perfume_id', perfumeId);
    if (error) return;
    for (const row of (data ?? []) as { note: string }[]) {
      const key = row.note.toLowerCase();
      result.noteVotes[key] = (result.noteVotes[key] ?? 0) + 1;
    }
  } catch { /* keep no note votes */ }
}

async function loadPhotos(supabase: Supa, perfumeId: string, result: PerfumeCommunity) {
  try {
    const { data, error } = await supabase
      .from('perfume_photos')
      .select('id, public_url, created_at, user_id, author:profiles(display_name)')
      .eq('perfume_id', perfumeId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return;
    type Row = { id: string; public_url: string | null; created_at: string; user_id: string; author: { display_name: string } | { display_name: string }[] | null };
    result.photos = ((data ?? []) as Row[])
      .filter(r => r.public_url)
      .map((r): PhotoRow => ({ id: r.id, url: r.public_url as string, created_at: r.created_at, user_id: r.user_id, author: one(r.author)?.display_name ?? '' }));
  } catch { /* keep no photos */ }
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
