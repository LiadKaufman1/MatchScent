import type { NextRequest } from 'next/server';
import { quickSearch } from '@/lib/quick-search';
import { tooManyRequests } from '@/lib/rate-limit';

// Live typeahead for the header's search box: name + picture as you type (perfumes only; the full /search page also
// covers brands and notes). Reads the already-cached catalogue, so it is cheap - a generous per-IP limit is enough.
//   GET /api/quick-search?q=<text>
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (tooManyRequests(request, 'quick-search', 120)) return Response.json([], { status: 429 });
  const hits = await quickSearch(q);
  return Response.json(hits, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
