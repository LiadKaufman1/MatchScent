import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { searchInspired, getHouses, houseLetter, type HouseEntry, type InspiredItem } from '@/lib/load-directory';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from '@/app/components/Photo';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

const PER_PAGE = 36;

export function inspiredIndexMetadata(lang: Lang, filtered: boolean): Metadata {
  const t = getDict(lang).inspiredIndex;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: withLang(lang, '/inspired'), languages: { he: '/inspired', en: '/en/inspired', 'x-default': '/inspired' } },
    // Search / filter / later pages are not separate pages for search engines.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

// One pair: the inspired fragrance, then the perfume(s) it is inspired by.
function Pair({ item, lang }: { item: InspiredItem; lang: Lang }) {
  const t = getDict(lang);
  const e = item.entry;
  const name = (
    <>
      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{e.brand}</span>
      <span className="block font-extrabold leading-tight text-ink">{e.name}</span>
    </>
  );
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-line bg-white">
          <Photo url={e.image_url} alt={`${e.brand} ${e.name}`} seed={e.brand + e.name} sizes="72px" />
        </span>
        {e.perfumeSlug ? (
          <Link href={withLang(lang, `/perfume/${e.perfumeSlug}`)} prefetch={false} className="min-w-0 hover:text-wine-700">{name}</Link>
        ) : (
          <span className="min-w-0">{name}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 border-t border-dashed border-line pt-3 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
        <span className="shrink-0 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-smoke">
          {t.inspiredIndex.inspiredBy}
          <ArrowLeft className="mx-auto mt-1 h-4 w-4 text-wine-600 ltr:rotate-180" aria-hidden="true" />
        </span>
        <ul className="min-w-0 space-y-2">
          {item.originals.slice(0, 2).map(o => (
            <li key={o.id}>
              <Link href={withLang(lang, `/perfume/${o.slug}`)} prefetch={false} className="flex items-center gap-2.5 hover:text-wine-700">
                <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                  <Photo url={o.image_url} alt={`${o.brand} ${o.name}`} seed={o.brand + o.name} sizes="44px" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-smoke">{o.brand}</span>
                  <span className="block text-sm font-bold leading-snug text-ink">{o.name}</span>
                </span>
              </Link>
            </li>
          ))}
          {item.originals.length > 2 && <li className="text-xs text-smoke">+{item.originals.length - 2}</li>}
        </ul>
      </div>
    </li>
  );
}

export async function InspiredIndexView({ lang, q, brand, page }: { lang: Lang; q: string; brand: string; page: number }) {
  const t = getDict(lang);
  const x = t.inspiredIndex;
  const { hits, brands } = await searchInspired(q, brand);
  const pages = Math.max(1, Math.ceil(hits.length / PER_PAGE));
  const current = Math.min(Math.max(page, 1), pages);
  const shown = hits.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const link = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (brand) params.set('brand', brand);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return withLang(lang, '/inspired') + (qs ? `?${qs}` : '');
  };

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/inspired" />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{x.heading}</h1>
        <p className="mt-3 max-w-2xl text-smoke">{x.intro}</p>
        <div className="wine-rule my-6 w-32" />

        <form action={withLang(lang, '/inspired')} method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{x.placeholder}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-600" aria-hidden="true" />
            <input name="q" type="search" defaultValue={q} placeholder={x.placeholder} className="w-full rounded-full border border-line bg-white py-3 pe-4 ps-11 outline-none focus:border-wine-600" />
          </label>
          <select name="brand" defaultValue={brand} aria-label={x.allBrands} className="rounded-full border border-line bg-white px-4 py-3 outline-none focus:border-wine-600">
            <option value="">{x.allBrands}</option>
            {brands.map(b => <option key={b.slug} value={b.slug}>{b.name} ({b.count})</option>)}
          </select>
          <button type="submit" className="rounded-full bg-wine-600 px-6 py-3 font-bold text-white transition hover:bg-wine-700">{x.filter}</button>
        </form>

        <p className="mt-5 text-sm font-medium text-smoke">{fmt(x.count, { n: hits.length })}</p>

        {shown.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-line bg-white p-8 text-center text-smoke">{x.none}</p>
        ) : (
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {shown.map(item => <Pair key={item.key} item={item} lang={lang} />)}
          </ul>
        )}

        {pages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-3 text-sm font-bold" aria-label={fmt(x.page, { n: current, total: pages })}>
            {current > 1 && <Link href={link(current - 1)} className="rounded-full border border-line bg-white px-4 py-2 hover:border-wine-600/60">{x.prev}</Link>}
            <span className="text-smoke">{fmt(x.page, { n: current, total: pages })}</span>
            {current < pages && <Link href={link(current + 1)} className="rounded-full border border-line bg-white px-4 py-2 hover:border-wine-600/60">{x.next}</Link>}
          </nav>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

// Letter pages: /brands/a ... /brands/z, /brands/num (digits) and /brands/other (other alphabets).
export const HOUSE_LETTERS = [...'abcdefghijklmnopqrstuvwxyz', 'num', 'other'];
const letterOf = (name: string) => {
  const l = houseLetter(name);
  return l === '#' ? 'num' : l === '…' ? 'other' : l.toLowerCase();
};
const letterLabel = (key: string, lang: Lang) =>
  key === 'num' ? '0-9' : key === 'other' ? getDict(lang).brandsIndex.otherLetter : key.toUpperCase();

export function housesMetadata(lang: Lang, letter?: string): Metadata {
  const t = getDict(lang).brandsIndex;
  const path = letter ? `/brands/${letter}` : '/brands';
  const l = letter ? letterLabel(letter, lang) : '';
  return {
    title: letter ? fmt(t.letterTitle, { l }) : t.metaTitle,
    description: letter ? fmt(t.letterDescription, { l }) : t.metaDescription,
    alternates: { canonical: withLang(lang, path), languages: { he: path, en: `/en${path}`, 'x-default': path } },
  };
}

function LetterBar({ lang, current }: { lang: Lang; current?: string }) {
  const t = getDict(lang).brandsIndex;
  return (
    <nav aria-label={t.byLetter} className="section-nav -mx-4 mb-8 border-y border-line px-4 sm:-mx-6 sm:px-6">
      <ul className="flex flex-wrap gap-1 py-2 text-sm font-bold" dir="ltr">
        {HOUSE_LETTERS.map(k => (
          <li key={k}>
            <Link
              href={withLang(lang, `/brands/${k}`)}
              prefetch={false}
              aria-current={k === current ? 'page' : undefined}
              className={`block rounded-full px-2.5 py-1 ${k === current ? 'bg-wine-600 text-white' : 'text-smoke hover:bg-blush hover:text-wine-700'}`}
            >
              {letterLabel(k, lang)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HouseList({ houses, lang }: { houses: HouseEntry[]; lang: Lang }) {
  return (
    <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4" dir="ltr">
      {houses.map(h => (
        <li key={h.slug} className="truncate text-sm">
          {h.onSite ? (
            <Link href={withLang(lang, `/brand/${h.slug}`)} prefetch={false} className="font-bold text-ink hover:text-wine-700">
              {h.name} <span className="font-medium text-smoke">({h.count})</span>
            </Link>
          ) : (
            <span className="text-smoke">{h.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// /brands: the houses that have fragrances on the site, A-Z, and the letter pages with every house.
// /brands/<letter>: every perfume house starting with that letter (the ones on the site are links).
export async function HousesView({ lang, letter }: { lang: Lang; letter?: string }) {
  const t = getDict(lang);
  const x = t.brandsIndex;
  const houses = await getHouses();
  const onSite = houses.filter(h => h.onSite);

  if (letter) {
    const shown = houses.filter(h => letterOf(h.name) === letter);
    return (
      <div className="site">
        <SiteHeader lang={lang} path={`/brands/${letter}`} />
        <main className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
          <nav className="mb-3 text-sm text-smoke">
            <Link href={withLang(lang, '/brands')} className="font-bold text-wine-600 hover:text-wine-700">{x.heading}</Link>
          </nav>
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{fmt(x.letterTitle, { l: letterLabel(letter, lang) })}</h1>
          <p className="mt-3 text-sm font-medium text-smoke">{fmt(x.count, { n: shown.length })}</p>
          <div className="wine-rule my-6 w-32" />
          <LetterBar lang={lang} current={letter} />
          {shown.length ? <HouseList houses={shown} lang={lang} /> : <p className="text-smoke">{t.inspiredIndex.none}</p>}
        </main>
        <SiteFooter lang={lang} />
      </div>
    );
  }

  const groups = [...new Set(onSite.map(h => letterOf(h.name)))];
  return (
    <div className="site">
      <SiteHeader lang={lang} path="/brands" />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{x.heading}</h1>
        <p className="mt-3 max-w-2xl text-smoke">{x.intro}</p>
        <p className="mt-2 text-sm font-medium text-smoke">
          {x.onSite}: <span dir="ltr">{onSite.length}</span>
          {houses.length > onSite.length && <> · {x.total}: <span dir="ltr">{houses.length}</span></>}
        </p>
        <div className="wine-rule my-6 w-32" />

        <h2 className="section-title mb-3">{x.byLetter}</h2>
        <LetterBar lang={lang} />

        <h2 className="section-title mb-5">{x.onSite}</h2>
        <div className="space-y-8">
          {groups.map(k => (
            <section key={k} aria-labelledby={`letter-${k}`}>
              <h3 id={`letter-${k}`} className="mb-3 text-lg font-extrabold text-wine-700" dir="ltr">{letterLabel(k, lang)}</h3>
              <HouseList houses={onSite.filter(h => letterOf(h.name) === k)} lang={lang} />
            </section>
          ))}
        </div>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
