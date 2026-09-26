import { createHash } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { classifyResults, cleanStoreUrl, expandStores, finalizeOffers, serperRows, type CleanOffer, type RawResult, type RawStore, type SerperRow } from './price-offers';
import { hasBlockedWord } from './catalog';
import { tagStoreUrl } from './store-links';
import { storeSearchUrl, type CountryCode } from './stores';
import type { PriceOffer, PriceReport } from './price-types';

// Live prices for one perfume in the visitor's country. Server only: the search service's key never leaves here.
//
// How it works (the visitor never sees any of this):
//   1. Searches for "<brand> <name>" in the visitor's country give every listing with its store and price. In Israel
//      the search is made twice, plain and with the Hebrew word for perfume added: the two answers list different
//      stores (one found KSP, the other Super-Pharm), and together they miss far fewer.
//   2. price-offers.ts throws out samples, gift sets, other versions, look-alikes ... and keeps the real bottles.
//   3. The visitor's click on "to the store" asks /api/prices/go for the store's own page of that listing (one more
//      lookup, made only for clicks), and the browser is sent there.
// Both lookups cost one search each on the search service's plan, so results are kept for PRICE_CACHE_HOURS (72 by
// default) and shared by everyone: the shared cache of the hosting platform, plus a copy in the server's memory.

const SEARCH_URL = 'https://serpapi.com/search.json';
const HOURS = Math.max(1, Number(process.env.PRICE_CACHE_HOURS) || 72);

const MARKET: Record<CountryCode, { gl: string; hl: string; domain: string }> = {
  IL: { gl: 'il', hl: 'iw', domain: 'google.co.il' },
  US: { gl: 'us', hl: 'en', domain: 'google.com' },
  GB: { gl: 'gb', hl: 'en', domain: 'google.co.uk' },
  WORLD: { gl: 'us', hl: 'en', domain: 'google.com' },
};

export const pricesConfigured = () => !!(process.env.SERPER_API_KEY || process.env.SERPAPI_KEY);
// Serper (google.serper.dev) is about 15 times cheaper per search than SerpApi and is used whenever its key is set;
// SerpApi stays as the fallback. Serper has no "product page with every store" and its own links go to Google, so the
// stores are found with more (cheap) searches - one that names each main Israeli store - and the button of a row opens the
// store's own search page (storeSearchUrl).
const serperEnabled = () => !!process.env.SERPER_API_KEY;

type Wanted = { brand: string; name: string; gender?: string | null };
type Search = { results: RawResult[]; at: string; complete: boolean };

const handleOf = (token: string) => createHash('sha256').update(token).digest('base64url').slice(0, 12);

// A small memory cache (per server instance) so a burst of visitors for the same perfume costs one lookup,
// even before the shared cache has the answer.
const memory = new Map<string, { until: number; value: Promise<unknown> }>();
function remember<T>(key: string, hours: number, make: () => Promise<T>, keep: (v: T) => boolean = () => true): Promise<T> {
  const hit = memory.get(key);
  if (hit && hit.until > Date.now()) return hit.value as Promise<T>;
  const value = make();
  memory.set(key, { until: Date.now() + hours * 3600_000, value });
  if (memory.size > 600) memory.delete(memory.keys().next().value as string);
  value.then(v => { if (!keep(v)) memory.delete(key); }, () => memory.delete(key));
  return value;
}

async function serp(params: Record<string, string>, hours: number): Promise<{ status: number; data: Record<string, unknown> } | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const url = new URL(SEARCH_URL);
  url.search = new URLSearchParams({ ...params, api_key: key }).toString();
  try {
    const res = await fetch(url, { next: { revalidate: hours * 3600 } });
    return { status: res.status, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } catch {
    return null;
  }
}

// The words stores put in front of the perfume's name. Fragrantica files some lines under another house than the stores
// use: "Emporio Armani Stronger With You" is Giorgio Armani there, and searching "Giorgio Armani Stronger With You"
// found almost no Israeli store (KSP, which sells it, was missing; 2026-09-25) while "Emporio Armani Stronger With You"
// finds KSP, Super-Pharm, Shufersal and more. Add a line here when a perfume is known to be sold under another house.
const EMPORIO_ARMANI_LINES = /\b(stronger with you|because it'?s you|in love with you|emporio|diamonds|remix|city glam)\b/i;
export function searchName(wanted: Wanted): string {
  const brand = /^giorgio armani$/i.test(wanted.brand.trim()) && EMPORIO_ARMANI_LINES.test(wanted.name) ? 'Emporio Armani' : wanted.brand;
  const q = wanted.name.toLowerCase().includes(brand.toLowerCase()) ? wanted.name : `${brand} ${wanted.name}`;
  return q.replace(/\s+/g, ' ').trim();
}

// One search. null = it failed (a search that found nothing is a real answer, an empty list).
async function searchOnce(q: string, country: CountryCode): Promise<{ results: RawResult[]; at: number } | null> {
  const m = MARKET[country];
  const r = await serp({ engine: 'google_shopping', q, gl: m.gl, hl: m.hl, google_domain: m.domain }, HOURS);
  if (!r || r.status !== 200) return null;
  const list = r.data.shopping_results;
  if (!Array.isArray(list) && !/hasn't returned any results/i.test(String(r.data.error ?? ''))) return null;
  const meta = r.data.search_metadata as { processed_at?: string } | undefined;
  const at = meta?.processed_at ? new Date(meta.processed_at.replace(' UTC', 'Z').replace(' ', 'T')).getTime() : Date.now();
  return { results: (Array.isArray(list) ? list : []) as RawResult[], at: isNaN(at) ? Date.now() : at };
}

async function search(wanted: Wanted, country: CountryCode): Promise<Search | null> {
  const q = searchName(wanted);
  const queries = country === 'IL' && !LIGHT ? [q, `${q} בושם`] : [q];
  return remember(`s|${country}|${q.toLowerCase()}`, HOURS, async () => {
    const parts = await Promise.all(queries.map(x => searchOnce(x, country)));
    const done = parts.filter((p): p is NonNullable<typeof p> => p !== null);
    if (!done.length) return null;
    return {
      results: done.flatMap(p => p.results),
      at: new Date(Math.min(...done.map(p => p.at))).toISOString(),
      complete: done.length === parts.length,
    };
  }, v => v !== null && v.complete);
}

// Google shows one store per row, even when a listing is sold by several (the one shown changes from search to
// search). The product page of such a listing names every store, each with its own address: that is how KSP,
// Super-Pharm and the others are all found. Up to EXPAND_PRODUCTS listings are opened that way (Israeli first).
// PRICE_LOOKUP_MODE=light halves the cost (one search, one product page) while the search plan is small.
const LIGHT = process.env.PRICE_LOOKUP_MODE === 'light';
const EXPAND_PRODUCTS = LIGHT ? 1 : 2;

async function storesOf(token: string): Promise<RawStore[]> {
  return remember(`p|${handleOf(token)}`, HOURS, async () => {
    const r = await serp({ engine: 'google_immersive_product', page_token: token }, HOURS);
    const stores = (r?.status === 200 ? (r.data.product_results as { stores?: RawStore[] } | undefined)?.stores : null) ?? null;
    return stores;
  }, v => v !== null).then(v => v ?? []);
}

type SerperAnswer = { rows: SerperRow[]; at: string };

// One Serper search (1 credit). Kept HOURS in the platform's cache; a failure throws, so it is never kept.
const serperCached = unstable_cache(async (q: string, gl: string, hl: string): Promise<SerperAnswer> => {
  const res = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY ?? '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, gl, hl, num: 40 }),
  });
  if (!res.ok) throw new Error(`serper ${res.status}`);
  const data = (await res.json()) as { shopping?: SerperRow[]; message?: string };
  if (!Array.isArray(data.shopping) && data.message) throw new Error('serper: ' + data.message);
  return { rows: Array.isArray(data.shopping) ? data.shopping : [], at: new Date().toISOString() };
}, ['serper-shopping-v1'], { revalidate: HOURS * 3600 });

function serperOnce(q: string, country: CountryCode): Promise<SerperAnswer | null> {
  const m = MARKET[country];
  return remember(`z|${m.gl}|${q.toLowerCase()}`, HOURS, () => serperCached(q, m.gl, m.hl).catch(() => null), v => v !== null);
}

// The main Israeli stores get their own search ("<perfume> KSP"): a store's listing that the plain search leaves out
// (KSP's plain Eau de Toilette of Stronger With You at 245 NIS) is found this way. Only stores that the first searches
// did not already show are searched.
const ISRAELI_STORE_SEARCHES: { query: string; match: RegExp }[] = [
  { query: 'KSP', match: /^ksp$/i },
  { query: 'סופר פארם', match: /super.?pharm|סופר.?פארם/i },
  { query: 'YBrands', match: /y\s?brands/i },
];

async function collectSerper(wanted: Wanted, country: CountryCode): Promise<{ offers: CleanOffer[]; at: string } | null> {
  const q = searchName(wanted);
  const opts = { country, isBlocked: hasBlockedWord };
  const answers: SerperAnswer[] = [];
  const take = (list: (SerperAnswer | null)[]) => { for (const a of list) if (a) answers.push(a); };

  take(await Promise.all((country === 'IL' ? [q, `${q} בושם`] : [q]).map(x => serperOnce(x, country))));
  if (!answers.length) return null;

  const clean = () => finalizeOffers(classifyResults(serperRows(answers.flatMap(a => a.rows)), wanted, opts));
  let offers = clean();
  if (country === 'IL') {
    const missing = ISRAELI_STORE_SEARCHES.filter(s => !offers.some(o => s.match.test(o.store)));
    if (missing.length) {
      take(await Promise.all(missing.map(s => serperOnce(`${q} ${s.query}`, country))));
      offers = clean();
    }
  }
  const at = new Date(Math.min(...answers.map(a => new Date(a.at).getTime()))).toISOString();
  const withPages = offers.map(o => ({ ...o, url: o.url ?? storeSearchUrl(o.store, q, country) }));
  return { offers: withPages.slice(0, 40), at };
}

// Every offer we know for this perfume, each with what opens its store: the store's own address, or (for a listing seen
// only in the search rows) the token that lets us look the address up when someone clicks.
async function collect(wanted: Wanted, country: CountryCode): Promise<{ offers: CleanOffer[]; at: string } | null> {
  if (serperEnabled()) return collectSerper(wanted, country);
  const found = await search(wanted, country);
  if (!found) return null;
  const opts = { country, isBlocked: hasBlockedWord };

  const listed = classifyResults(found.results, wanted, opts);
  const picked = new Map<string, CleanOffer>();
  for (const o of [...listed].filter(x => x.multi && !x.tester && x.token).sort((a, b) => Number(a.expandOnly) - Number(b.expandOnly) || Number(a.approx) - Number(b.approx) || a.rank - b.rank)) {
    const key = o.productId ?? o.token ?? '';
    if (picked.size < EXPAND_PRODUCTS && !picked.has(key)) picked.set(key, o);
  }
  const opened = await Promise.all([...picked.values()].map(async parent => expandStores(await storesOf(parent.token as string), parent, wanted, opts)));
  return { offers: finalizeOffers([...listed, ...opened.flat()]).slice(0, 40), at: found.at };
}

// The visitor's browser never gets a store address: each row carries a short handle, and the click goes through /go.
const handleFor = (o: CleanOffer) => (o.url ?? o.token ? handleOf((o.url ?? o.token) as string) : null);

export async function getPrices(wanted: Wanted, country: CountryCode): Promise<PriceReport> {
  if (!pricesConfigured()) return { ok: false, reason: 'unavailable' };
  const found = await collect(wanted, country);
  if (!found) return { ok: false, reason: 'unavailable' };
  const offers: PriceOffer[] = found.offers.map(o => ({ store: o.store, title: o.title, price: o.price, currency: o.currency, sizeMl: o.sizeMl, tester: o.tester, approx: o.approx, go: handleFor(o) }));
  return offers.length ? { ok: true, offers, fetchedAt: found.at } : { ok: false, reason: 'none' };
}

const sameStore = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// The store's own page for a listing found by the token of a search row (one more lookup, kept 24 h).
async function pageOfToken(token: string, store: string): Promise<string | null> {
  return remember(`g|${handleOf(token)}`, 24, async () => {
    const r = await serp({ engine: 'google_immersive_product', page_token: token }, 24);
    if (!r || r.status !== 200) return null;
    const stores = ((r.data.product_results as { stores?: { name?: string; link?: string }[] } | undefined)?.stores ?? []).filter(s => s.link);
    const pick = stores.find(s => sameStore(s.name ?? '', store)) ?? stores[0];
    return cleanStoreUrl(pick?.link);
  }, v => v !== null);
}

export type StoreTarget = { url: string; store: string; price: number; currency: string; sizeMl: number | null };

// Where a click on one row of the price panel goes (found by the row's handle): the store's own page, marked as coming
// from us (tagStoreUrl), plus what is needed to count the click.
export async function resolveStorePage(wanted: Wanted, country: CountryCode, handle: string): Promise<StoreTarget | null> {
  if (!pricesConfigured() || !/^[A-Za-z0-9_-]{12}$/.test(handle)) return null;
  const found = await collect(wanted, country);
  const offer = found?.offers.find(o => handleFor(o) === handle);
  if (!offer) return null;
  const url = offer.url ?? (offer.token ? await pageOfToken(offer.token, offer.store) : null);
  if (!url) return null;
  return { url: tagStoreUrl(url), store: offer.store, price: offer.price, currency: offer.currency, sizeMl: offer.sizeMl };
}
