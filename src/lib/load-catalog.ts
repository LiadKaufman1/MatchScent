import { cache } from 'react';
import { getSupabase, type Perfume, type Dupe } from './supabase';
import { prepareCatalog } from './catalog';
import { mockPerfumes, mockDupes } from './mockData';
import { slugify } from './slug';

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

  return { perfume, entries, sameBrand, more };
}
