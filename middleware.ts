import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// The one job of this middleware: keep a logged-in visitor's session cookie fresh.
// Supabase Auth sessions expire; without this, someone could get logged out while
// browsing even though they never clicked "log out." It does not decide who can see
// what - that's Row Level Security in the database.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response; // no Supabase configured (e.g. a preview without env vars) - do nothing

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        // Rebuild the response so the request's own cookies (read by Server Components
        // further down the chain) and the response's cookies both see the update.
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        // Stop a CDN/proxy from ever caching a response that sets someone's session
        // cookie - otherwise a later visitor could be served a stranger's cookie.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Reading the user is what actually triggers a refresh of an expiring session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Every path except static assets, images and the favicon.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
