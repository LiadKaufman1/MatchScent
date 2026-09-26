import { cache } from 'react';
import { getCatalog, hasContent, isCatalogOriginal, type ShownPerfume } from './load-catalog';
import { isRealPhoto } from './images';

// Every perfume on the site, for the "All fragrances" page: the ones with similar scents first, then the ones that have
// something on their page (notes, an original they are inspired by), then the rest; inside each group the ones with a
// real picture first, then A-Z.

export type PerfumeKind = 'all' | 'originals' | 'inspired';
export type PerfumeGender = 'all' | 'male' | 'female' | 'unisex';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const group = (p: ShownPerfume) => (p.entryCount > 0 ? 0 : hasContent(p) ? 1 : 2);

const sortedAll = cache(async (): Promise<{ p: ShownPerfume; text: string }[]> => {
  const { perfumes } = await getCatalog();
  return [...perfumes]
    .sort((a, b) =>
      group(a) - group(b)
      || Number(isRealPhoto(b.image_url)) - Number(isRealPhoto(a.image_url))
      || `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
    .map(p => ({ p, text: fold(`${p.brand} ${p.name}`) }));
});

export async function listPerfumes(opts: { q: string; gender: PerfumeGender; kind: PerfumeKind }): Promise<{ total: number; hits: ShownPerfume[] }> {
  const all = await sortedAll();
  const words = fold(opts.q).split(' ').filter(Boolean);
  const hits = all
    .filter(({ p, text }) =>
      (opts.gender === 'all' || p.gender === opts.gender)
      && (opts.kind === 'all' || (opts.kind === 'inspired') === !isCatalogOriginal(p))
      && words.every(w => text.includes(w)))
    .map(x => x.p);
  return { total: all.length, hits };
}
