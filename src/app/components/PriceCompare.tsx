'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Search, Store, X } from 'lucide-react';
import { useCountry } from '@/lib/use-country';
import { COUNTRIES, type CountryCode } from '@/lib/stores';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import type { PriceOffer, PriceReport } from '@/lib/price-types';

// "Where is it cheapest to buy?": a button that opens a panel on our own site with the store prices for this
// perfume in the visitor's country (fetched from /api/prices when the pointer reaches the button, so the panel is
// usually ready when it opens). Each row's button opens the store's own page.

type Loaded = { country: CountryCode; report: PriceReport };

const SYMBOL: Record<string, string> = { ILS: '₪', USD: '$', GBP: '£', EUR: '€' };
const money = (n: number, currency: string) => `${SYMBOL[currency] ?? ''}${Math.round(n).toLocaleString('en-US')}`;

function ago(iso: string, lang: Lang, updated: string): string {
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3600_000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'he' ? 'he' : 'en', { numeric: 'auto' });
  const when = hours < 1 ? rtf.format(0, 'hour') : hours < 36 ? rtf.format(-Math.round(hours), 'hour') : rtf.format(-Math.round(hours / 24), 'day');
  return fmt(updated, { when });
}

export default function PriceCompare({ perfumeKey, brand, name, lang, variant = 'card' }: {
  perfumeKey: string;
  brand: string;
  name: string;
  lang: Lang;
  variant?: 'hero' | 'card';
}) {
  const t = getDict(lang);
  const country = useCountry();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<CountryCode | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const requested = useRef<Set<string>>(new Set());

  const load = useCallback((c: CountryCode) => {
    if (requested.current.has(c)) return;
    requested.current.add(c);
    fetch(`/api/prices?k=${encodeURIComponent(perfumeKey)}&c=${c}`)
      .then(r => r.json() as Promise<PriceReport>)
      .then(report => {
        if (!report.ok && report.reason === 'unavailable') requested.current.delete(c); // try again next time
        setLoaded({ country: c, report });
      })
      .catch(() => { requested.current.delete(c); setFailed(c); });
  }, [perfumeKey]);

  // Open / close the native dialog (it traps focus and closes on Escape by itself).
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  const mine = loaded && loaded.country === country ? loaded.report : null;
  const loading = open && !!country && !mine && failed !== country;

  const view = useMemo(() => {
    if (!mine || !mine.ok) return null;
    const regular = mine.offers.filter(o => !o.tester);
    const testers = mine.offers.filter(o => o.tester);
    const counts = new Map<number, number>();
    for (const o of regular) if (o.sizeMl) counts.set(o.sizeMl, (counts.get(o.sizeMl) ?? 0) + 1);
    const sizes = [...counts.keys()].sort((a, b) => a - b);
    const usual = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null;
    const chosen = size && counts.has(size) ? size : usual;
    const main = chosen ? regular.filter(o => o.sizeMl === chosen) : regular.filter(o => o.sizeMl === null);
    const unknown = chosen ? regular.filter(o => o.sizeMl === null) : [];
    return { sizes, chosen, main, unknown, testers, at: mine.fetchedAt };
  }, [mine, size]);

  if (!country) {
    return <div className="mt-auto pt-4"><span className="block h-[60px] animate-pulse rounded-xl bg-blush" aria-hidden="true" /></div>;
  }

  const inCountry = t.countriesIn[country];
  const stores = COUNTRIES[country].stores;
  const go = (o: PriceOffer) => o.go
    ? `${withLang(lang, '/go')}?${new URLSearchParams({ k: perfumeKey, c: country, h: o.go, n: o.store.slice(0, 60) })}`
    : null;
  const start = () => load(country);

  const row = (o: PriceOffer, best?: number, first = false) => {
    const href = go(o);
    return (
      <li key={`${o.store}|${o.price}|${o.sizeMl}|${o.tester}`} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${first ? 'border-wine-600/60 bg-blush/60' : 'border-line bg-white'}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush text-wine-600" aria-hidden="true"><Store className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-ink">{o.store}</span>
            {first && <span className="rounded-full bg-wine-600 px-2 py-0.5 text-[11px] font-bold text-white">{t.prices.cheapest}</span>}
            {o.tester && <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-bold text-smoke">{t.prices.tester}</span>}
          </span>
          <span className="mt-0.5 block truncate text-start text-xs text-smoke" dir="auto" title={o.title}>{o.title}</span>
        </span>
        <span className="shrink-0 text-end">
          <span className="block text-lg font-extrabold leading-tight text-ink" dir="ltr">{money(o.price, o.currency)}</span>
          {best !== undefined && !first && o.price - best >= 1 && <span className="block text-xs font-medium text-smoke" dir="ltr">+{money(o.price - best, o.currency)}</span>}
        </span>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-wine-600 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-wine-700"
          >
            {t.prices.toStore}
            <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </a>
        )}
      </li>
    );
  };

  const storeButtons = (
    <div className="mt-4 flex flex-wrap gap-2">
      {stores.map(s => (
        <a key={s.id} href={s.url(`${brand} ${name}`)} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-wine-600/60">
          {s.name}
          <ArrowUpRight className="h-4 w-4 text-wine-600 rtl:-scale-x-100" aria-hidden="true" />
        </a>
      ))}
    </div>
  );

  const hero = variant === 'hero';
  return (
    <div className={hero ? 'w-full' : 'mt-auto pt-4'}>
      <button
        type="button"
        aria-haspopup="dialog"
        onPointerEnter={start}
        onFocus={start}
        onTouchStart={start}
        onClick={() => { start(); setOpen(true); }}
        className={`group flex w-full items-center gap-3 rounded-xl bg-wine-600 text-white shadow-[0_14px_24px_-14px_rgba(126,31,55,0.75)] transition hover:bg-wine-700 ${hero ? 'px-5 py-4' : 'px-4 py-3.5'}`}
      >
        <Search className={hero ? 'h-6 w-6 shrink-0' : 'h-5 w-5 shrink-0'} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-start">
          <span className={`block font-bold leading-tight ${hero ? 'text-lg' : 'text-[15px]'}`}>{fmt(t.prices.cta, { in: inCountry })}</span>
          <span className="mt-0.5 block text-xs text-white/85">{t.prices.ctaHint}</span>
        </span>
        <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={`prices-${perfumeKey}`}
        onClose={() => setOpen(false)}
        onClick={e => { if (e.target === dialog.current) setOpen(false); }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-xl sm:rounded-3xl"
      >
        {open && (
          <div className="flex max-h-[92dvh] flex-col">
            <header className="flex items-start gap-3 border-b border-line px-5 pb-4 pt-5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{brand}</p>
                <h2 id={`prices-${perfumeKey}`} className="text-xl font-extrabold leading-tight text-ink">{name}</h2>
                <p className="mt-1 text-sm font-medium text-smoke">{fmt(t.prices.title, { in: inCountry })}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.prices.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink transition hover:border-wine-600">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-[14rem] flex-1 overflow-y-auto px-5 py-4">
              {loading && (
                <div role="status" aria-live="polite">
                  <p className="mb-4 flex items-center gap-2 text-sm font-medium text-smoke">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-wine-600/30 border-t-wine-600" aria-hidden="true" />
                    {fmt(t.prices.loading, { in: inCountry })} <span className="text-smoke/70">{t.prices.loadingHint}</span>
                  </p>
                  <ul className="space-y-2.5" aria-hidden="true">
                    {[0, 1, 2, 3].map(i => <li key={i} className="h-[72px] animate-pulse rounded-2xl bg-blush" style={{ opacity: 1 - i * 0.18 }} />)}
                  </ul>
                </div>
              )}

              {!loading && (!mine || !mine.ok) && (
                <div>
                  <p className="rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-ink">
                    {mine && !mine.ok && mine.reason === 'none' ? fmt(t.prices.none, { in: inCountry }) : t.prices.unavailable}
                  </p>
                  <p className="mt-4 text-sm text-smoke">{t.prices.tryStores}</p>
                  {storeButtons}
                </div>
              )}

              {view && (
                <div>
                  {view.sizes.length > 1 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t.prices.sizeLabel}>
                      <span className="text-sm font-bold text-smoke">{t.prices.sizeLabel}</span>
                      {view.sizes.map(s => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={s === view.chosen}
                          onClick={() => setSize(s)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${s === view.chosen ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white text-ink hover:border-wine-600/60'}`}
                        >
                          {fmt(t.prices.sizeMl, { n: s })}
                        </button>
                      ))}
                    </div>
                  )}
                  {view.main.length > 0 && (
                    <ul className="space-y-2.5">
                      {view.main.map((o, i) => row(o, view.main[0].price, i === 0))}
                    </ul>
                  )}
                  {view.unknown.length > 0 && (
                    <section className="mt-5">
                      <h3 className="text-sm font-bold text-smoke">{t.prices.unknownSize}</h3>
                      <p className="mb-2 text-xs text-smoke">{t.prices.unknownSizeHint}</p>
                      <ul className="space-y-2.5">{view.unknown.map(o => row(o))}</ul>
                    </section>
                  )}
                  {view.testers.length > 0 && (
                    <details className="mt-5 rounded-2xl border border-line p-3.5">
                      <summary className="cursor-pointer text-sm font-bold text-smoke">{t.prices.testersTitle} ({view.testers.length})</summary>
                      <ul className="mt-3 space-y-2.5">{view.testers.map(o => row(o))}</ul>
                    </details>
                  )}
                </div>
              )}
            </div>

            <footer className="border-t border-line bg-[#FCFAF9] px-5 py-3">
              <p className="text-xs leading-relaxed text-smoke">
                {view && <span className="font-bold">{ago(view.at, lang, t.prices.updated)}. </span>}
                {t.prices.disclaimer}
              </p>
            </footer>
          </div>
        )}
      </dialog>
    </div>
  );
}
