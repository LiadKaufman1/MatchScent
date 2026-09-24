import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/load-catalog';
import { getBrandSlugs, getNoteSlugs } from '@/lib/load-browse';
import { LANGS, withLang } from '@/lib/i18n';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

// The list of pages we want Google to know about, in English and Hebrew, each linked
// to its twin in the other language. Main perfumes that have nothing on their page yet are
// left out until they have similar scents; every inspired fragrance has its own page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { perfumes } = await getCatalog();
  const [brands, notes] = await Promise.all([getBrandSlugs(), getNoteSlugs(3)]);

  const paths: { path: string; changeFrequency: 'daily' | 'weekly' | 'yearly'; priority: number }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/accessibility', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/top', changeFrequency: 'daily', priority: 0.7 },
    { path: '/inspired', changeFrequency: 'daily', priority: 0.7 },
    { path: '/brands', changeFrequency: 'weekly', priority: 0.5 },
    ...perfumes
      .filter(p => p.entryCount > 0)
      .map(p => ({ path: `/perfume/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...perfumes
      .filter(p => p.entryCount === 0 && p.inspiredOf.length > 0)
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
