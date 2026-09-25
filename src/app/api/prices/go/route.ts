import type { NextRequest } from 'next/server';
import { findByEntryKey } from '@/lib/load-catalog';
import { resolveStorePage } from '@/lib/prices';
import { tooManyRequests } from '@/lib/rate-limit';
import { normalizeCountry } from '@/lib/stores';

// The store's own page for one listing of the price panel (used by the /go page that the "to the store" button opens).
//   GET /api/prices/go?k=<perfume key>&c=<country>&h=<listing handle>   ->   { url }
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const key = params.get('k') ?? '';
  const handle = params.get('h') ?? '';
  if (!/^[a-z0-9-]{1,200}$/.test(key) || !/^[A-Za-z0-9_-]{12}$/.test(handle)) return Response.json({ url: null }, { status: 400 });
  if (tooManyRequests(request, 'go', 30)) return Response.json({ url: null }, { status: 429 });

  const wanted = await findByEntryKey(key);
  if (!wanted) return Response.json({ url: null }, { status: 404 });

  const url = await resolveStorePage(wanted, normalizeCountry(params.get('c')), handle);
  return Response.json({ url }, { headers: { 'Cache-Control': url ? 'public, s-maxage=86400' : 'no-store' } });
}
