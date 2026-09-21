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
