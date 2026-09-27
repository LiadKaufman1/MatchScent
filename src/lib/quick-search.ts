import { getCatalog } from './load-catalog';

// A fast, perfume-only search for the header's live dropdown: name + picture as you type, no page navigation.
// The full /search page (still reachable by pressing Enter) also covers brands and notes.

export type QuickSearchHit = { id: string; slug: string; brand: string; name: string; image_url: string | null };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const LIMIT = 8;

export async function quickSearch(query: string): Promise<QuickSearchHit[]> {
  const words = fold(query).split(' ').filter(Boolean);
  if (!words.length || query.length > 80) return [];

  const { perfumes } = await getCatalog();
  const startsWith = (text: string) => { const t = words.map(w => new RegExp(`(?:^|\\s)${w}`)); return t.every(re => re.test(fold(text))); };

  const hits = perfumes
    .map(p => {
      const text = `${p.brand} ${p.name}`;
      if (!words.every(w => fold(text).includes(w))) return null;
      return { p, rank: startsWith(text) ? 0 : 1 };
    })
    .filter((x): x is { p: (typeof perfumes)[number]; rank: number } => x !== null)
    .sort((a, b) => a.rank - b.rank || Number(b.p.entryCount > 0) - Number(a.p.entryCount > 0) || `${a.p.brand} ${a.p.name}`.localeCompare(`${b.p.brand} ${b.p.name}`))
    .slice(0, LIMIT);

  return hits.map(({ p }) => ({ id: p.id, slug: p.slug, brand: p.brand, name: p.name, image_url: p.image_url ?? null }));
}
