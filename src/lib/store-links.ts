import { getSupabaseAdmin } from './supabase-admin';

// Everything that leaves the site towards a store goes through /go, so each click can be counted and marked.

// Stores that pay for the visitors we send get their own tracking mark here (an affiliate id, a referral code ...).
// Add one line per store once you have agreed it with them; the match is on the store's web address.
//   { host: /(^|\.)blendo\.co\.il$/, params: { ref: 'matchscent' } },
type Partner = { host: RegExp; params: Record<string, string> };
export const PARTNERS: Partner[] = [];

// Every store link carries utm_source=matchscent, so the store sees in its own statistics who sent the visitor.
export function tagStoreUrl(link: string): string {
  try {
    const u = new URL(link);
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'matchscent');
      u.searchParams.set('utm_medium', 'price-comparison');
    }
    for (const p of PARTNERS) {
      if (p.host.test(u.hostname)) for (const [key, value] of Object.entries(p.params)) u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    return link;
  }
}

export type StoreClick = { store: string; perfumeKey: string; country: string; price: number; currency: string; sizeMl: number | null; lang: string };

const ROBOTS = /bot|crawl|spider|slurp|preview|headless|monitor|curl|wget|python|scrapy/i;

// Counts one click for the monthly report (table store_clicks). Best effort: a failure never stops the visitor, and
// robots are not counted. Nothing personal is stored: no address, no account, no browser details.
export async function logStoreClick(click: StoreClick, userAgent: string | null): Promise<void> {
  if (!userAgent || ROBOTS.test(userAgent)) return;
  try {
    await getSupabaseAdmin().from('store_clicks').insert({
      store: click.store.slice(0, 120),
      perfume_key: click.perfumeKey.slice(0, 200),
      country: click.country.slice(0, 8),
      price: Number.isFinite(click.price) ? click.price : null,
      currency: click.currency.slice(0, 8),
      size_ml: click.sizeMl,
      lang: click.lang.slice(0, 8),
    });
  } catch {
    // the table may not exist yet, or the database may be busy
  }
}
