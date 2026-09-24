'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from './supabase-browser';

// Who is looking at the page? Read from the browser's own session (no network call), and
// never baked into the page itself - the pages are static and shared by every visitor.
// The server actions re-check the session on every write, so this is only for what to show.
export function useViewer(): { ready: boolean; userId: string | null } {
  const [state, setState] = useState<{ ready: boolean; userId: string | null }>({ ready: false, userId: null });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setState({ ready: true, userId: data.session?.user.id ?? null });
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string } } | null) => {
      if (active) setState({ ready: true, userId: session?.user.id ?? null });
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
