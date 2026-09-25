import { cache } from 'react';
import { getSupabase, type Perfume, type Dupe } from './supabase';
import { prepareCatalog } from './catalog';
import { mockPerfumes, mockDupes } from './mockData';
import { slugify } from './slug';

import { entryKey, getPerfumeCommunity } from './load-community';
export { entryKey } from './load-community';
export type { ReviewWithAuthor, EntryVoteCounts, PerfumeCommunity } from './community-types';

// entryCount: how many "inspired by" fragrances it has. inspiredOf: the ids of the perfumes whose lists
// include THIS fragrance (so it is an inspired fragrance, or at least reminds people of them).
export type ShownPerfume = Perfume & { entryCount: number; slug: string; inspiredOf: string[] };
// An entry of an "inspired by" list, with the address of the fragrance's own page when it has one.
export type ShownEntry = Dupe & { perfumeSlug?: string };

// The perfumes the home page lists: everything except fragrances that are only known as "inspired by"
// something (those have their own page and the "inspired" index instead).
export const isCatalogOriginal = (p: ShownPerfume) => p.entryCount > 0 || p.inspiredOf.length === 0;

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
async function loadCatalog(): Promise<{ perfumes: ShownPerfume[]; dupes: ShownEntry[] }> {
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

  // Which perfume row is each entry? The link column (after the v5 migration), otherwise the same
  // brand + name - so the page works before and after that migration.
  const shownIds = new Set(catalog.perfumes.map(p => p.id));
  const idByKey = new Map(catalog.perfumes.map(p => [entryKey(p.brand, p.name), p.id]));
  const targetOf = (d: Dupe) =>
    (d.inspired_perfume_id && shownIds.has(d.inspired_perfume_id) ? d.inspired_perfume_id : null) ?? idByKey.get(entryKey(d.brand, d.name)) ?? null;
  const inspiredOf = new Map<string, string[]>();
  for (const d of catalog.dupes) {
    const target = targetOf(d);
    if (!target || target === d.original_perfume_id) continue;
    const list = inspiredOf.get(target) ?? [];
    if (!list.includes(d.original_perfume_id)) list.push(d.original_perfume_id);
    inspiredOf.set(target, list);
  }

  const sorted = catalog.perfumes
    .map(p => ({ ...p, entryCount: counts.get(p.id) ?? 0, inspiredOf: inspiredOf.get(p.id) ?? [] }))
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

  const slugById = new Map(perfumes.map(p => [p.id, p.slug]));
  const dupes: ShownEntry[] = catalog.dupes.map(d => {
    const target = targetOf(d);
    return { ...d, perfumeSlug: target ? slugById.get(target) : undefined };
  });

  return { perfumes, dupes };
}

// Within one page render, read the database only once.
export const getCatalog = cache(loadCatalog);

// The perfume (or similar-scent entry) whose address key is this one - what the price lookup searches for.
export async function findByEntryKey(key: string): Promise<{ brand: string; name: string; gender: string | null } | null> {
  const { perfumes, dupes } = await getCatalog();
  const p = perfumes.find(x => entryKey(x.brand, x.name) === key);
  if (p) return { brand: p.brand, name: p.name, gender: p.gender ?? null };
  const d = dupes.find(x => entryKey(x.brand, x.name) === key);
  return d ? { brand: d.brand, name: d.name, gender: null } : null;
}

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

  // The perfumes this fragrance is inspired by, with its place in each of their lists.
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const inspiredBy = perfume.inspiredOf
    .map(id => {
      const original = byId.get(id);
      if (!original) return null;
      const list = dupes.filter(d => d.original_perfume_id === id).sort((a, b) => b.similarity_score - a.similarity_score);
      const rank = list.findIndex(d => d.perfumeSlug === perfume.slug) + 1;
      return { original, rank: rank > 0 ? rank : null, of: list.length };
    })
    .filter((x): x is { original: ShownPerfume; rank: number | null; of: number } => !!x)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  // Other fragrances inspired by the same perfume(s) - the alternatives to this alternative.
  const siblings = dupes
    .filter(d => perfume.inspiredOf.includes(d.original_perfume_id) && d.perfumeSlug !== perfume.slug)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .filter((d, i, all) => all.findIndex(x => x.perfumeSlug ? x.perfumeSlug === d.perfumeSlug : entryKey(x.brand, x.name) === entryKey(d.brand, d.name)) === i)
    .slice(0, 8);

  const sameBrand = perfumes.filter(p => p.brand === perfume.brand && p.id !== perfume.id).slice(0, 6);

  // A different set of "keep exploring" links on every page, so pages link to each other.
  const pool = perfumes.filter(p => p.entryCount > 0 && p.id !== perfume.id && p.brand !== perfume.brand);
  const start = pool.length ? hash(slug) % pool.length : 0;
  const more = Array.from({ length: Math.min(6, pool.length) }, (_, i) => pool[(start + i) % pool.length]);

  const community = await getPerfumeCommunity(perfume.id);

  return { perfume, entries, inspiredBy, siblings, sameBrand, more, community };
}
