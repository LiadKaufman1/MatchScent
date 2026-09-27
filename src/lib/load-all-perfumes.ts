import { cache } from 'react';
import { getCatalog, hasContent, isCatalogOriginal, type ShownPerfume } from './load-catalog';
import { isRealPhoto } from './images';
import { slugify } from './slug';

// Every perfume on the site, for the "All fragrances" page: the ones with similar scents first, then the ones that have
// something on their page (notes, an original they are inspired by), then the rest; inside each group the ones with a
// real picture first, then A-Z.

// "inspired" is not offered here: /inspired is its own page for that. "originals" narrows to what isCatalogOriginal
// keeps (the home page's perfumes); "all" (the default) lists every perfume, including the ones inspired by another.
export type PerfumeKind = 'all' | 'originals';
export type PerfumeGender = 'all' | 'male' | 'female' | 'unisex';
export type BrandOption = { slug: string; name: string; count: number };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const group = (p: ShownPerfume) => (p.entryCount > 0 ? 0 : hasContent(p) ? 1 : 2);

const sortedAll = cache(async (): Promise<{ p: ShownPerfume; text: string; brandSlug: string }[]> => {
  const { perfumes } = await getCatalog();
  return [...perfumes]
    .sort((a, b) =>
      group(a) - group(b)
      || Number(isRealPhoto(b.image_url)) - Number(isRealPhoto(a.image_url))
      || `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
    .map(p => ({ p, text: fold(`${p.brand} ${p.name}`), brandSlug: slugify(p.brand) }));
});

// The houses offered in the brand filter, most perfumes on the site first.
export const listBrandsForFilter = cache(async (): Promise<BrandOption[]> => {
  const all = await sortedAll();
  const brands = new Map<string, BrandOption>();
  for (const { p, brandSlug } of all) {
    const b = brands.get(brandSlug) ?? { slug: brandSlug, name: p.brand, count: 0 };
    b.count++;
    brands.set(brandSlug, b);
  }
  return [...brands.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

export async function listPerfumes(opts: { q: string; gender: PerfumeGender; kind: PerfumeKind; brand: string }): Promise<{ total: number; hits: ShownPerfume[] }> {
  const all = await sortedAll();
  const words = fold(opts.q).split(' ').filter(Boolean);
  const hits = all
    .filter(({ p, text, brandSlug }) =>
      (opts.gender === 'all' || p.gender === opts.gender)
      && (opts.kind === 'all' || isCatalogOriginal(p))
      && (!opts.brand || brandSlug === opts.brand)
      && words.every(w => text.includes(w)))
    .map(x => x.p);
  return { total: all.length, hits };
}
