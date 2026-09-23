'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { logoutUser } from '@/lib/auth-actions';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';

// Shows "log in / sign up" or "hi, {name}" in the header. This is a client component
// (reads the browser's session) on purpose: it lets the rest of the page stay static
// and fast, instead of forcing every page to be rendered fresh per visitor.
export default function AuthStatus({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const router = useRouter();
  const [name, setName] = useState<string | null>(null); // null = logged out (or not known yet)
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let active = true;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setName(null); setReady(true); }
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      if (active) { setName(profile?.display_name ?? user.email ?? ''); setReady(true); }
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Reserve the space so the header doesn't jump once we know whether someone is logged in.
  if (!ready) return <div className="h-4 w-24" aria-hidden="true" />;

  if (name === null) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em]">
        <Link href={withLang(lang, '/login')} className="text-smoke transition hover:text-wine-600">{t.auth.loginCta}</Link>
        <span className="text-line" aria-hidden="true">•</span>
        <Link href={withLang(lang, '/register')} className="text-wine-600 transition hover:text-wine-700">{t.auth.registerCta}</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="hidden font-bold text-ink sm:inline">{fmt(t.auth.greeting, { name })}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          await logoutUser();
          router.refresh();
        })}
        className="font-bold uppercase tracking-[0.1em] text-smoke transition hover:text-wine-600 disabled:opacity-50"
      >
        {t.auth.logoutCta}
      </button>
    </div>
  );
}
