import { cache } from 'react';
import { getCatalog, entryKey, type ShownEntry, type ShownPerfume } from './load-catalog';
import { getSupabase } from './supabase';
import { slugify } from './slug';

// The two big directories: every inspired fragrance next to its original(s), and every perfume house.

export type InspiredItem = {
  key: string;
  entry: ShownEntry;          // brand, name, picture, and perfumeSlug when it has its own page
  originals: ShownPerfume[];  // the perfumes it is inspired by
  best: number;               // its best place in any list (100 = first), to show the closest first
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function loadInspired(): Promise<InspiredItem[]> {
  const { perfumes, dupes } = await getCatalog();
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const items = new Map<string, InspiredItem>();
  for (const d of dupes) {
    const key = d.perfumeSlug ?? entryKey(d.brand, d.name);
    const original = byId.get(d.original_perfume_id);
    if (!original) continue;
    const item = items.get(key) ?? { key, entry: d, originals: [], best: 0 };
    if (!item.originals.some(o => o.id === original.id)) item.originals.push(original);
    if (d.similarity_score > item.best) item.best = d.similarity_score;
    if (!item.entry.image_url && d.image_url) item.entry = d;
    items.set(key, item);
  }
  return [...items.values()].sort((a, b) => b.best - a.best || b.originals.length - a.originals.length || a.entry.name.localeCompare(b.entry.name));
}
export const getInspiredIndex = cache(loadInspired);

export async function searchInspired(query: string, brandSlug: string) {
  const all = await getInspiredIndex();
  const words = fold(query).split(/\s+/).filter(Boolean);
  const brands = new Map<string, { slug: string; name: string; count: number }>();
  for (const i of all) {
    const slug = slugify(i.entry.brand);
    const b = brands.get(slug) ?? { slug, name: i.entry.brand, count: 0 };
    b.count++;
    brands.set(slug, b);
  }
  const hits = all.filter(i => {
    if (brandSlug && slugify(i.entry.brand) !== brandSlug) return false;
    if (!words.length) return true;
    const text = fold(`${i.entry.brand} ${i.entry.name} ${i.originals.map(o => `${o.brand} ${o.name}`).join(' ')}`);
    return words.every(w => text.includes(w));
  });
  return { total: all.length, hits, brands: [...brands.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)) };
}

export type HouseEntry = { slug: string; name: string; count: number; onSite: boolean };

// Houses with fragrances on the site (from the catalogue), plus every other house from the "brands"
// table (added by the owner's scripts; missing before the v5 migration - then the list is just ours).
async function loadHouses(): Promise<HouseEntry[]> {
  const { perfumes, dupes } = await getCatalog();
  const houses = new Map<string, HouseEntry>();
  const seen = new Map<string, Set<string>>();
  for (const x of [...perfumes, ...dupes]) {
    const slug = slugify(x.brand);
    if (!slug) continue;
    const h = houses.get(slug) ?? { slug, name: x.brand, count: 0, onSite: true };
    const names = seen.get(slug) ?? new Set<string>();
    const k = fold(x.name);
    if (!names.has(k)) { names.add(k); h.count++; }
    seen.set(slug, names);
    houses.set(slug, h);
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = getSupabase();
      for (let from = 0; from < 30000; from += 1000) {
        const { data, error } = await supabase.from('brands').select('slug, name').order('slug').range(from, from + 999);
        if (error || !data) break;
        for (const b of data as { slug: string; name: string }[]) {
          if (!houses.has(b.slug)) houses.set(b.slug, { slug: b.slug, name: b.name, count: 0, onSite: false });
        }
        if (data.length < 1000) break;
      }
    } catch { /* no brands table yet */ }
  }
  return [...houses.values()].sort((a, b) => fold(a.name).localeCompare(fold(b.name)));
}
export const getHouses = cache(loadHouses);

// "A" ... "Z", "#" for digits, "…" for other alphabets.
export const houseLetter = (name: string) => {
  const c = fold(name).trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : /[0-9]/.test(c) ? '#' : '…';
};
