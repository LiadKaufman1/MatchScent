import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only client using the service role key, which bypasses RLS.
// WARNING: Never expose this to the client-side!
//
// Created on first use (not when the file loads), so a missing variable cannot
// crash the build; it shows up as a clear error only when the admin is used.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
    }
    client = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}
