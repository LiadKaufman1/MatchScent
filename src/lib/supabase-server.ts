import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// A Supabase client for Server Components/Actions that knows who is logged in
// (reads/writes the auth cookies through Next's `cookies()`). Unlike
// supabase-admin.ts, this uses the public anon key: reads and writes go through
// the database's Row Level Security as that specific user, not as an admin.
//
// Created fresh per call (Next's cookie store is request-scoped), matching the
// "construct lazily, not at module load" spirit of the other Supabase clients.
export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set');
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // (This client is only ever used from Server Actions in this app - login, logout,
      // rating/review submits - whose responses are never cached by a CDN, so unlike
      // middleware.ts there is no response to attach cache-control headers to here.)
      setAll: cookiesToSet => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component render (not a Server Action/Route Handler):
          // cookies can't be written there. The middleware refreshes the session instead.
        }
      },
    },
  });
}
