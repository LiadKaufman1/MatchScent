import { createBrowserClient } from '@supabase/ssr';

// Created on first use, not when the module loads (same reasoning as the other clients).
let client: ReturnType<typeof createBrowserClient> | null = null;

// A Supabase client for Client Components that need live auth state (e.g. the
// header showing who is logged in without a full page reload).
export function getSupabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set');
    }
    client = createBrowserClient(url, anonKey);
  }
  return client;
}
