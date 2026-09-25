// How much of the site is built ahead of time. Every page built at deploy time is stored with that deployment, and
// Vercel's free plan stores 10 GB in total (a full build is ~700 MB, and every preview and every merge adds one). So:
//   - the live Hebrew site builds everything (a page nobody has opened yet takes 2-3 s to open);
//   - English pages and preview builds build only the main perfumes; the rest are built on their first visit and kept.
export const buildsWholeSite = (lang: 'he' | 'en') => lang === 'he' && process.env.VERCEL_ENV !== 'preview';

// The public address of the website (used for links inside search results and the sitemap).
//
// When you buy a domain, set NEXT_PUBLIC_SITE_URL in Vercel (for example
// https://matchscent.com) and redeploy. Until then the Vercel address is used.
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}
