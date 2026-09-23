import { cache } from 'react';
import { getSupabase, type Perfume, type Dupe } from './supabase';
import { prepareCatalog } from './catalog';
import { mockPerfumes, mockDupes } from './mockData';
import { slugify } from './slug';

export type ReviewWithAuthor = { id: string; body: string; created_at: string; author: string };
export type PerfumeCommunity = { average: number; count: number; reviews: ReviewWithAuthor[] };

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

// Average rating + reviews for one perfume. This is public data (same for every
// visitor), so it is safe to bake into a static/ISR page - unlike "did THIS visitor
// already rate it", which belongs client-side, per browser session, never here.
//
// The "ratings"/"reviews" tables are new and may not exist yet if the owner hasn't
// run db-migrations/2026-09-accounts-and-reviews.sql. Unlike perfumes/dupes above,
// a missing table here must not break the page - it just means no ratings yet.
async function getPerfumeCommunity(perfumeId: string): Promise<PerfumeCommunity> {
  const empty: PerfumeCommunity = { average: 0, count: 0, reviews: [] };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return empty;

  try {
    const supabase = getSupabase();
    const [{ data: scoreRows }, { data: reviewRows }] = await Promise.all([
      supabase.from('ratings').select('score').eq('perfume_id', perfumeId),
      supabase
        .from('reviews')
        .select('id, body, created_at, author:profiles(display_name)')
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const scores = (scoreRows ?? []) as { score: number }[];
    const average = scores.length ? scores.reduce((sum, r) => sum + r.score, 0) / scores.length : 0;

    type ReviewRow = { id: string; body: string; created_at: string; author: { display_name: string } | { display_name: string }[] | null };
    const reviews = ((reviewRows ?? []) as ReviewRow[]).map(r => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      author: (Array.isArray(r.author) ? r.author[0]?.display_name : r.author?.display_name) ?? '',
    }));

    return { average, count: scores.length, reviews };
  } catch {
    return empty; // tables not migrated yet, or a transient error - the rest of the page still works
  }
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
