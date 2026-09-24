import { getCatalog, isCatalogOriginal, type ShownEntry, type ShownPerfume } from './load-catalog';
import { noteGroups } from './notes';
import { NOTES_HE } from './notes-he';
import { slugify } from './slug';

// One search box for the whole site: original perfumes, "inspired by" fragrances, brands and notes.
// Hebrew works too for notes ("וניל" finds vanilla).

export type SearchResults = {
  perfumes: ShownPerfume[];
  inspired: { entry: ShownEntry; original: ShownPerfume }[];
  brands: { name: string; slug: string; count: number }[];
  notes: { name: string; slug: string; count: number }[];
};

const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`]/g, '').replace(/&/g, ' and ').replace(/\s+/g, ' ').trim();

// Every word of the query must appear somewhere in the text ("tom ford vanille" finds "Tom Ford Tobacco Vanille").
const matches = (text: string, words: string[]) => {
  const t = fold(text);
  return words.every(w => t.includes(w));
};

const LIMIT = 30;

export async function searchSite(query: string): Promise<SearchResults> {
  const words = fold(query).split(' ').filter(Boolean);
  const empty: SearchResults = { perfumes: [], inspired: [], brands: [], notes: [] };
  if (!words.length || query.length > 80) return empty;

  const { perfumes, dupes } = await getCatalog();
  const byId = new Map(perfumes.map(p => [p.id, p]));

  const found: SearchResults = {
    ...empty,
    perfumes: perfumes.filter(p => isCatalogOriginal(p) && matches(`${p.brand} ${p.name}`, words)).slice(0, LIMIT),
  };

  const seen = new Set<string>();
  for (const d of dupes) {
    if (found.inspired.length >= LIMIT) break;
    const original = byId.get(d.original_perfume_id);
    const key = d.perfumeSlug ?? slugify(`${d.brand} ${d.name}`);
    if (!original || seen.has(key) || !matches(`${d.brand} ${d.name}`, words)) continue;
    seen.add(key);
    found.inspired.push({ entry: d, original });
  }

  const brands = new Map<string, { name: string; slug: string; count: number }>();
  const counted = new Set<string>();
  for (const x of [...perfumes, ...dupes]) {
    const slug = slugify(x.brand);
    const one = slugify(`${x.brand} ${x.name}`);
    if (!slug || counted.has(one) || !matches(x.brand, words)) continue;
    counted.add(one);
    const entry = brands.get(slug) ?? { name: x.brand, slug, count: 0 };
    entry.count++;
    brands.set(slug, entry);
  }
  found.brands = [...brands.values()].sort((a, b) => b.count - a.count).slice(0, LIMIT);

  const notes = new Map<string, { name: string; slug: string; count: number }>();
  const noted = new Set<string>();
  for (const item of [...perfumes, ...dupes]) {
    const one = slugify(`${item.brand} ${item.name}`);
    if (noted.has(one)) continue;
    noted.add(one);
    for (const g of noteGroups(item.note_pyramid)) for (const n of g.notes) {
      const he = NOTES_HE[n.toLowerCase()] ?? '';
      if (!matches(`${n} ${he}`, words)) continue;
      const slug = slugify(n);
      const entry = notes.get(slug) ?? { name: n, slug, count: 0 };
      entry.count++;
      notes.set(slug, entry);
    }
  }
  found.notes = [...notes.values()].sort((a, b) => b.count - a.count).slice(0, LIMIT);
  return found;
}

// "Similar in character": other original perfumes that share the most notes and main accords with
// this one (our own comparison of the pyramids, not anybody's votes).
export async function similarByNotes(perfume: ShownPerfume, limit = 6): Promise<ShownPerfume[]> {
  const { perfumes } = await getCatalog();
  const features = (p: ShownPerfume) => new Set([
    ...noteGroups(p.note_pyramid).flatMap(g => g.notes.map(n => `n:${n.toLowerCase()}`)),
    ...(p.accords ?? []).slice(0, 6).map(a => `a:${a.toLowerCase()}`),
  ]);
  const mine = features(perfume);
  if (mine.size < 3) return [];
  return perfumes
    .filter(p => p.id !== perfume.id && isCatalogOriginal(p))
    .map(p => {
      const other = features(p);
      const shared = [...other].filter(f => mine.has(f)).length;
      return { p, score: other.size ? shared / (mine.size + other.size - shared) : 0 };
    })
    .filter(x => x.score >= 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.p);
}

