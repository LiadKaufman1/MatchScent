'use server';

import { supabaseAdmin } from './supabase-admin';
import type { LivePrice } from './supabase';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

export async function fetchLivePrices(
  dupeId: string, 
  dupeName: string, 
  brand: string, 
  type: 'il' | 'amazon'
): Promise<{ success: boolean; prices?: LivePrice[]; error?: string }> {
  try {
    // 1. Check database first to avoid API limits
    const { data: dupe, error: dbError } = await supabaseAdmin
      .from('dupes')
      .select('live_prices_il, live_prices_amazon')
      .eq('id', dupeId)
      .single();

    if (dbError) throw new Error(dbError.message);

    const cachedPrices = type === 'il' ? dupe.live_prices_il : dupe.live_prices_amazon;
    if (cachedPrices && Array.isArray(cachedPrices) && cachedPrices.length > 0) {
      return { success: true, prices: cachedPrices };
    }

    // 2. Fetch from SerpApi if no cache
    if (!SERPAPI_KEY) {
      throw new Error('SERPAPI_KEY is not configured on the server.');
    }

    const query = `${brand} ${dupeName}`;
    let url = '';

    if (type === 'il') {
      // Google Shopping Israel (gl=il) or US if IL has no results, but we'll stick to US (gl=us) 
      // because Google Shopping IL is sometimes barren for English dupe names. 
      // The user just wants places to buy. Let's use US for wider results, or just general.
      url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&hl=en&gl=us&api_key=${SERPAPI_KEY}`;
    } else {
      url = `https://serpapi.com/search.json?engine=amazon&q=${encodeURIComponent(query)}&amazon_domain=amazon.com&api_key=${SERPAPI_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    let parsedPrices: LivePrice[] = [];

    if (type === 'il') {
      // Parse Google Shopping
      const items = data.shopping_results || [];
      const validItems = items.filter((item: any) => item.price && item.link);
      
      // Sort by price (SerpApi price is usually a float in extracted_price)
      validItems.sort((a: any, b: any) => (a.extracted_price || 9999) - (b.extracted_price || 9999));

      parsedPrices = validItems.slice(0, 3).map((item: any) => ({
        store: item.source || 'Store',
        price: item.price,
        link: item.link
      }));
    } else {
      // Parse Amazon Search Results
      const items = data.organic_results || [];
      const validItems = items.filter((item: any) => item.price?.raw && item.link);
      
      validItems.sort((a: any, b: any) => (a.price?.value || 9999) - (b.price?.value || 9999));

      parsedPrices = validItems.slice(0, 3).map((item: any) => ({
        store: 'Amazon',
        price: item.price.raw,
        link: item.link
      }));
    }

    // 3. Save back to database
    if (parsedPrices.length > 0) {
      const updatePayload = type === 'il' 
        ? { live_prices_il: parsedPrices } 
        : { live_prices_amazon: parsedPrices };

      await supabaseAdmin.from('dupes').update(updatePayload).eq('id', dupeId);
    }

    return { success: true, prices: parsedPrices };
  } catch (error: any) {
    console.error('Error fetching live prices:', error);
    return { success: false, error: error.message };
  }
}
