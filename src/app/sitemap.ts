import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/load-catalog';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

// The list of pages we want Google to know about. Perfumes that have nothing on
// their page yet are left out until they have similar scents.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { perfumes } = await getCatalog();

  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    ...perfumes
      .filter(p => p.entryCount > 0)
      .map(p => ({
        url: `${base}/perfume/${p.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
  ];
}
