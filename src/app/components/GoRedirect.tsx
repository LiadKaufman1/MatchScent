'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';

// The page a "to the store" button opens in a new tab: finds the store's own page for the chosen listing and
// sends the visitor there. It shows our own screen while it works (a few seconds the first time).
export default function GoRedirect({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const params = useSearchParams();
  const [lookupFailed, setFailed] = useState(false);
  const store = (params.get('n') ?? '').slice(0, 60);
  const k = params.get('k'), c = params.get('c'), h = params.get('h');
  const failed = lookupFailed || !k || !c || !h;

  useEffect(() => {
    if (!k || !c || !h) return;
    let live = true;
    fetch(`/api/prices/go?${new URLSearchParams({ k, c, h })}`)
      .then(r => r.json() as Promise<{ url: string | null }>)
      .then(d => {
        if (!live) return;
        if (d.url) window.location.replace(d.url);
        else setFailed(true);
      })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [k, c, h]);

  return (
    <div className="mx-auto max-w-sm text-center" role="status" aria-live="polite">
      {failed ? (
        <>
          <p className="text-lg font-bold text-ink">{t.prices.goFail}</p>
          <p className="mt-2 text-sm text-smoke">{t.prices.goHint}</p>
          <Link href={withLang(lang, '/')} className="mt-6 inline-block rounded-full bg-wine-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-wine-700">{t.prices.goBack}</Link>
        </>
      ) : (
        <>
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-wine-600/25 border-t-wine-600" aria-hidden="true" />
          <p className="mt-6 text-lg font-bold text-ink">{fmt(t.prices.goOpening, { store: store || '...' })}</p>
          <p className="mt-2 text-sm text-smoke">{t.prices.goHint}</p>
        </>
      )}
    </div>
  );
}
