import { cache } from 'react';
import { getSupabase, type Perfume, type Dupe } from './supabase';
import { prepareCatalog } from './catalog';
import { mockPerfumes, mockDupes } from './mockData';
import { slugify } from './slug';

import { ASPECTS, type Aspect, type PerfumeCommunity } from './community-types';
export type { ReviewWithAuthor, EntryVoteCounts, PerfumeCommunity } from './community-types';

// Votes on an "inspired by" fragrance belong to the perfume + this key (not to the row id),
// so re-importing the lists never wipes the visitors' votes.
export const entryKey = (brand: string, name: string) => slugify(`${brand} ${name}`);

export type ShownPerfume = Perfume & { entryCount: number; slug: string };

// Supabase returns at most 1000 rows per request, so read in pages.
async function fetchAll<T>(table: string): Promise<T[]> {
  const supabase = getSupabase();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id')
      .range(from, from + 999);
    if (error) throw new Error(`Could not read "${table}": ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

// Runs on the server. Perfumes that have similar scents come first.
async function loadCatalog(): Promise<{ perfumes: ShownPerfume[]; dupes: Dupe[] }> {
  let raw: { perfumes: Perfume[]; dupes: Dupe[] };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // No database settings. Sample data is for local development only; real
    // visitors get an empty state instead of made-up perfumes.
    raw = process.env.NODE_ENV === 'development'
      ? { perfumes: mockPerfumes, dupes: mockDupes }
      : { perfumes: [], dupes: [] };
  } else {
    // If the database cannot be read, this throws on purpose: during a
    // background refresh the last good version of the page stays online.
    const [perfumes, dupes] = await Promise.all([fetchAll<Perfume>('perfumes'), fetchAll<Dupe>('dupes')]);
    raw = { perfumes, dupes };
  }

  const catalog = prepareCatalog(raw.perfumes, raw.dupes);

  const counts = new Map<string, number>();
  for (const d of catalog.dupes) counts.set(d.original_perfume_id, (counts.get(d.original_perfume_id) ?? 0) + 1);

  const sorted = catalog.perfumes
    .map(p => ({ ...p, entryCount: counts.get(p.id) ?? 0 }))
    .sort((a, b) =>
      Number(b.entryCount > 0) - Number(a.entryCount > 0) ||
      a.brand.localeCompare(b.brand) ||
      a.name.localeCompare(b.name)
    );

  // Every perfume gets its own web address, e.g. "creed-aventus".
  const used = new Set<string>();
  const perfumes: ShownPerfume[] = sorted.map(p => {
    let slug = slugify(`${p.brand} ${p.name}`) || p.id;
    if (used.has(slug)) slug = `${slug}-${p.id.slice(0, 6)}`;
    used.add(slug);
    return { ...p, slug };
  });

  return { perfumes, dupes: catalog.dupes };
}

// Within one page render, read the database only once.
export const getCatalog = cache(loadCatalog);

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// Community data for one perfume: ratings (overall + details), reviews, votes on the
// "inspired by" entries, and how many people have it on their shelf. All of it is public
// data (same for every visitor), so it is safe to bake into a static/ISR page - unlike
// "did THIS visitor already rate/vote", which belongs client-side, never here.
//
// These tables/columns are added by the owner-run migrations (2026-09-accounts-and-reviews.sql,
// 2026-09-community-v2-and-notes.sql). Unlike perfumes/dupes above, a missing one must not
// break the page - each part below falls back to "nothing yet" on its own.
async function getPerfumeCommunity(perfumeId: string): Promise<PerfumeCommunity> {
  const empty: PerfumeCommunity = {
    average: 0,
    count: 0,
    aspects: { scent: null, longevity: null, sillage: null, bottle: null, value: null },
    reviews: [],
    entryVotes: {},
    shelf: { own: 0, had: 0, want: 0 },
  };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return empty;

  const supabase = getSupabase();
  const result: PerfumeCommunity = { ...empty, aspects: { ...empty.aspects } };

  // Ratings: try with the detail columns; if they do not exist yet, fall back to the overall score.
  try {
    type RatingRow = { score: number } & Partial<Record<Aspect, number | null>>;
    let rows: RatingRow[] | null = null;
    const wide = await supabase.from('ratings').select('score, scent, longevity, sillage, bottle, value').eq('perfume_id', perfumeId);
    if (!wide.error) rows = wide.data as RatingRow[];
    else {
      const narrow = await supabase.from('ratings').select('score').eq('perfume_id', perfumeId);
      if (!narrow.error) rows = narrow.data as RatingRow[];
    }
    if (rows?.length) {
      result.count = rows.length;
      result.average = rows.reduce((sum, r) => sum + r.score, 0) / rows.length;
      for (const aspect of ASPECTS) {
        const values = rows.map(r => r[aspect]).filter((v): v is number => typeof v === 'number');
        if (values.length) result.aspects[aspect] = { average: values.reduce((a, b) => a + b, 0) / values.length, count: values.length };
      }
    }
  } catch { /* keep the empty ratings */ }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, body, created_at, user_id, author:profiles(display_name)')
      .eq('perfume_id', perfumeId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) {
      type ReviewRow = { id: string; body: string; created_at: string; user_id: string; author: { display_name: string } | { display_name: string }[] | null };
      result.reviews = ((data ?? []) as ReviewRow[]).map(r => ({
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        user_id: r.user_id,
        author: (Array.isArray(r.author) ? r.author[0]?.display_name : r.author?.display_name) ?? '',
      }));
    }
  } catch { /* keep no reviews */ }

  try {
    const { data, error } = await supabase.from('entry_votes').select('entry_key, vote').eq('perfume_id', perfumeId);
    if (!error) {
      for (const row of (data ?? []) as { entry_key: string; vote: number }[]) {
        const counts = (result.entryVotes[row.entry_key] ??= { up: 0, down: 0 });
        if (row.vote > 0) counts.up++; else counts.down++;
      }
    }
  } catch { /* keep no votes */ }

  try {
    const { data, error } = await supabase.from('collections').select('status').eq('perfume_id', perfumeId);
    if (!error) {
      for (const row of (data ?? []) as { status: 'own' | 'had' | 'want' }[]) result.shelf[row.status]++;
    }
  } catch { /* keep an empty shelf */ }

  return result;
}

// Everything one perfume page needs.
export async function getPerfumePage(slug: string) {
  const { perfumes, dupes } = await getCatalog();
  const perfume = perfumes.find(p => p.slug === slug);
  if (!perfume) return null;

  const entries = dupes
    .filter(d => d.original_perfume_id === perfume.id)
    .sort((a, b) => b.similarity_score - a.similarity_score);

  const sameBrand = perfumes.filter(p => p.brand === perfume.brand && p.id !== perfume.id).slice(0, 6);

  // A different set of "keep exploring" links on every page, so pages link to each other.
  const pool = perfumes.filter(p => p.entryCount > 0 && p.id !== perfume.id && p.brand !== perfume.brand);
  const start = pool.length ? hash(slug) % pool.length : 0;
  const more = Array.from({ length: Math.min(6, pool.length) }, (_, i) => pool[(start + i) % pool.length]);

  const community = await getPerfumeCommunity(perfume.id);

  return { perfume, entries, sameBrand, more, community };
}
