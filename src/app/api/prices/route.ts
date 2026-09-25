import type { NextRequest } from 'next/server';
import { findByEntryKey } from '@/lib/load-catalog';
import { getPrices } from '@/lib/prices';
import { tooManyRequests } from '@/lib/rate-limit';
import { normalizeCountry } from '@/lib/stores';
import type { PriceReport } from '@/lib/price-types';

// Live prices of one perfume in the visitor's country, for the price panel.
//   GET /api/prices?k=<perfume key, e.g. creed-aventus>&c=<IL|US|GB|WORLD>
// Only perfumes on the site can be looked up (the key is checked against the catalogue), so this cannot be used
// to send arbitrary searches through the paid search service. Good answers are kept by the CDN for 12 hours (and served
// while a fresh one is fetched); a browser keeps one for 5 minutes only, so it never shows a days-old snapshot.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const key = params.get('k') ?? '';
  const none: PriceReport = { ok: false, reason: 'none' };
  if (!/^[a-z0-9-]{1,200}$/.test(key)) return Response.json(none, { status: 400 });
  if (tooManyRequests(request, 'prices', 40)) return Response.json({ ok: false, reason: 'unavailable' } satisfies PriceReport, { status: 429 });

  const wanted = await findByEntryKey(key);
  if (!wanted) return Response.json(none, { status: 404 });

  const report = await getPrices(wanted, normalizeCountry(params.get('c')));
  const cacheable = report.ok || report.reason === 'none';
  return Response.json(report, {
    headers: cacheable
      ? { 'Cache-Control': 'public, max-age=300', 'Vercel-CDN-Cache-Control': 's-maxage=43200, stale-while-revalidate=259200' }
      : { 'Cache-Control': 'no-store' },
  });
}
