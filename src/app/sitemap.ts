import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/load-catalog';
import { getBrandSlugs, getNoteSlugs } from '@/lib/load-browse';
import { LANGS, withLang } from '@/lib/i18n';
import { siteUrl } from '@/lib/site';
import { HOUSE_LETTERS } from '@/views/DirectoryViews';
import { noteGroups } from '@/lib/notes';

export const revalidate = 3600;

// The list of pages we want Google to know about, in English and Hebrew, each linked
// to its twin in the other language. Main perfumes that have nothing on their page yet (no similar
// scents, no notes) are left out; every inspired fragrance has its own page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { perfumes } = await getCatalog();
  const [brands, notes] = await Promise.all([getBrandSlugs(), getNoteSlugs(3)]);

  const paths: { path: string; changeFrequency: 'daily' | 'weekly' | 'yearly'; priority: number }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/about', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/accessibility', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/perfumes', changeFrequency: 'daily', priority: 0.8 },
    { path: '/top', changeFrequency: 'daily', priority: 0.7 },
    { path: '/inspired', changeFrequency: 'daily', priority: 0.7 },
    { path: '/brands', changeFrequency: 'weekly', priority: 0.5 },
    ...HOUSE_LETTERS.map(l => ({ path: `/brands/${l}`, changeFrequency: 'weekly' as const, priority: 0.3 })),
    ...perfumes
      .filter(p => p.entryCount > 0)
      .map(p => ({ path: `/perfume/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...perfumes
      .filter(p => p.entryCount === 0 && (p.inspiredOf.length > 0 || noteGroups(p.note_pyramid).length > 0))
      .map(p => ({ path: `/perfume/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...brands.map(slug => ({ path: `/brand/${slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...notes.map(slug => ({ path: `/notes/${slug}`, changeFrequency: 'weekly' as const, priority: 0.4 })),
  ];

  return paths.flatMap(({ path, changeFrequency, priority }) =>
    LANGS.map(lang => ({
      url: `${base}${withLang(lang, path)}`,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(LANGS.map(l => [l, `${base}${withLang(l, path)}`])),
      },
    }))
  );
}
