import { after, type NextRequest } from 'next/server';
import { findByEntryKey } from '@/lib/load-catalog';
import { resolveStorePage } from '@/lib/prices';
import { tooManyRequests } from '@/lib/rate-limit';
import { normalizeCountry } from '@/lib/stores';
import { logStoreClick } from '@/lib/store-links';

// The store's own page for one row of the price panel (used by the /go page that the "to the store" button opens);
// it also counts the click for the monthly store report.
//   GET /api/prices/go?k=<perfume key>&c=<country>&h=<row handle>&l=<he|en>   ->   { url }
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const key = params.get('k') ?? '';
  const handle = params.get('h') ?? '';
  if (!/^[a-z0-9-]{1,200}$/.test(key) || !/^[A-Za-z0-9_-]{12}$/.test(handle)) return Response.json({ url: null }, { status: 400 });
  if (tooManyRequests(request, 'go', 30)) return Response.json({ url: null }, { status: 429 });

  const wanted = await findByEntryKey(key);
  if (!wanted) return Response.json({ url: null }, { status: 404 });

  const country = normalizeCountry(params.get('c'));
  const target = await resolveStorePage(wanted, country, handle);
  if (target) {
    const lang = params.get('l') === 'en' ? 'en' : 'he';
    const userAgent = request.headers.get('user-agent');
    after(() => logStoreClick({ store: target.store, perfumeKey: key, country, price: target.price, currency: target.currency, sizeMl: target.sizeMl, lang }, userAgent));
  }
  // never cached: every click has to reach the server to be counted
  return Response.json({ url: target?.url ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
