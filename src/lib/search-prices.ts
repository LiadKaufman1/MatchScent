'use server';

import { getSupabaseAdmin } from './supabase-admin';
import type { LivePrice } from './supabase';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

type PriceType = 'il' | 'amazon';

// SerpApi result shapes (only the fields we read)
type GoogleShoppingItem = { title?: string; price?: string; extracted_price?: number; product_link?: string; source?: string };
type AmazonItem = { title?: string; price?: string; extracted_price?: number; link?: string };

// Server actions can be called directly by anyone, so this action never trusts
// what the browser sends: it only accepts a dupe id and a known price type, and
// it reads the name/brand from our own database.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// SerpApi is on a small free plan. Successful lookups are cached in the database,
// but a lookup that finds nothing is not, so don't let the same one repeat quickly.
// (Best-effort only: this memory is per server instance.)
const COOLDOWN_MS = 10 * 60 * 1000;
const lastLookup = new Map<string, number>();

export async function fetchLivePrices(
  dupeId: string,
  type: PriceType
): Promise<{ success: boolean; prices?: LivePrice[]; error?: string }> {
  try {
    if (typeof dupeId !== 'string' || !UUID_RE.test(dupeId) || (type !== 'il' && type !== 'amazon')) {
      return { success: false, error: 'Invalid request.' };
    }

    // 1. Check database first to avoid API limits
    const { data: dupe, error: dbError } = await getSupabaseAdmin()
      .from('dupes')
      .select('name, brand, live_prices_il, live_prices_amazon')
      .eq('id', dupeId)
      .single();

    if (dbError || !dupe) throw new Error(dbError?.message ?? 'Not found');

    const cachedPrices = type === 'il' ? dupe.live_prices_il : dupe.live_prices_amazon;
    if (cachedPrices && Array.isArray(cachedPrices) && cachedPrices.length > 0) {
      return { success: true, prices: cachedPrices };
    }

    // 2. Fetch from SerpApi if no cache
    if (!SERPAPI_KEY) {
      throw new Error('SERPAPI_KEY is not configured on the server.');
    }

    const cooldownKey = `${dupeId}:${type}`;
    const last = lastLookup.get(cooldownKey);
    if (last && Date.now() - last < COOLDOWN_MS) {
      return { success: false, error: 'Please try again in a few minutes.' };
    }
    lastLookup.set(cooldownKey, Date.now());

    const dupeName: string = dupe.name;
    const query = `${dupe.brand} ${dupeName}`;
    let url = '';

    if (type === 'il') {
      url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&hl=en&gl=il&api_key=${SERPAPI_KEY}`;
    } else {
      url = `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.com&k=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const data = await response.json();

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    let parsedPrices: LivePrice[] = [];
    const searchWords = dupeName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);

    const isValidResult = (title: string | undefined) => {
      if (!title) return false;
      const t = title.toLowerCase();
      if (t.includes('decant') || t.includes('sample') || t.includes('vial') || t.includes('empty') || t.includes('body spray') || t.includes('deodorant')) return false;

      let matchCount = 0;
      for (const w of searchWords) {
        if (t.includes(w)) matchCount++;
      }
      return searchWords.length > 0 ? (matchCount / searchWords.length) >= 0.5 : true;
    };

    if (type === 'il') {
      // Parse Google Shopping
      const items: GoogleShoppingItem[] = data.shopping_results || [];
      const validItems = items.filter(item => item.price && item.product_link && isValidResult(item.title));

      // Sort by price (SerpApi price is usually a float in extracted_price)
      validItems.sort((a, b) => (a.extracted_price || 9999) - (b.extracted_price || 9999));

      parsedPrices = validItems.slice(0, 3).map(item => ({
        store: item.source || 'Store',
        price: item.price as string,
        link: item.product_link as string
      }));
    } else {
      // Parse Amazon Search Results
      const items: AmazonItem[] = data.organic_results || [];
      const validItems = items.filter(item => item.price && item.link && isValidResult(item.title));

      validItems.sort((a, b) => (a.extracted_price || 9999) - (b.extracted_price || 9999));

      parsedPrices = validItems.slice(0, 3).map(item => ({
        store: 'Amazon',
        price: item.price as string,
        link: item.link as string
      }));
    }

    // 3. Save back to database
    if (parsedPrices.length > 0) {
      const updatePayload = type === 'il'
        ? { live_prices_il: parsedPrices }
        : { live_prices_amazon: parsedPrices };

      await getSupabaseAdmin().from('dupes').update(updatePayload).eq('id', dupeId);
    }

    return { success: true, prices: parsedPrices };
  } catch (error) {
    // Log the detail on the server, but only send a generic message to the browser.
    console.error('Error fetching live prices:', error);
    return { success: false, error: 'Could not load prices right now.' };
  }
}
