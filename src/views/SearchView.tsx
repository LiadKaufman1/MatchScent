import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { searchSite } from '@/lib/search';
import { noteLabel } from '@/lib/notes';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from '@/app/components/Photo';
import PerfumeCard from '@/app/components/PerfumeCard';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

const heading = 'mb-4 section-title';

export function searchMetadata(lang: Lang): Metadata {
  return { title: getDict(lang).search.metaTitle, robots: { index: false, follow: true } };
}

export default async function SearchView({ lang, query }: { lang: Lang; query: string }) {
  const t = getDict(lang);
  const s = t.search;
  const q = query.trim().slice(0, 80);
  const r = await searchSite(q);
  const total = r.perfumes.length + r.inspired.length + r.brands.length + r.notes.length;

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/search" />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink">{s.heading}</h1>
        <form action={withLang(lang, '/search')} method="get" role="search" className="relative mt-6 max-w-xl">
          <label htmlFor="site-search" className="sr-only">{s.heading}</label>
          <Search className="pointer-events-none absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-wine-600" aria-hidden="true" />
          <input
            id="site-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={s.placeholder}
            autoComplete="off"
            className="w-full rounded-full border border-line bg-white py-4 pe-28 ps-14 text-base text-ink outline-none focus:border-wine-600"
          />
          <button type="submit" className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-wine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-wine-700">{s.submit}</button>
        </form>

        {!q ? (
          <p className="mt-6 text-smoke">{s.hint}</p>
        ) : total === 0 ? (
          <p className="mt-6 text-smoke">{fmt(s.none, { q })}</p>
        ) : (
          <div className="mt-10 space-y-12">
            {r.perfumes.length > 0 && (
              <section aria-labelledby="res-perfumes">
                <h2 id="res-perfumes" className={heading}>{s.perfumes}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.perfumes.map(p => <PerfumeCard key={p.id} perfume={p} lang={lang} />)}
                </div>
              </section>
            )}
            {r.inspired.length > 0 && (
              <section aria-labelledby="res-inspired">
                <h2 id="res-inspired" className={heading}>{s.inspired}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {r.inspired.map(({ entry, original }) => (
                    <li key={entry.id} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
                      <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-line">
                        <Photo url={entry.image_url} alt={`${entry.brand} ${entry.name}`} seed={entry.brand + entry.name} sizes="48px" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{entry.brand}</span>
                        {entry.perfumeSlug ? (
                          <Link href={withLang(lang, `/perfume/${entry.perfumeSlug}`)} prefetch={false} className="block font-bold text-ink hover:text-wine-700">{entry.name}</Link>
                        ) : (
                          <span className="block font-bold text-ink">{entry.name}</span>
                        )}
                        <span className="mt-1 block text-xs text-smoke">
                          {s.inspiredBy}{' '}
                          <Link href={withLang(lang, `/perfume/${original.slug}`)} prefetch={false} className="font-medium text-ink hover:text-wine-600 hover:underline">
                            {original.brand} {original.name}
                          </Link>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(r.brands.length > 0 || r.notes.length > 0) && (
              <div className="grid gap-10 md:grid-cols-2">
                {r.brands.length > 0 && (
                  <section aria-labelledby="res-brands">
                    <h2 id="res-brands" className={heading}>{s.brands}</h2>
                    <ul className="flex flex-wrap gap-2">
                      {r.brands.map(b => (
                        <li key={b.slug}>
                          <Link href={withLang(lang, `/brand/${b.slug}`)} prefetch={false} className="block rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink hover:border-wine-600/60">
                            {b.name} <span className="text-xs text-smoke">({fmt(s.count, { n: b.count })})</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {r.notes.length > 0 && (
                  <section aria-labelledby="res-notes">
                    <h2 id="res-notes" className={heading}>{s.notes}</h2>
                    <ul className="flex flex-wrap gap-2">
                      {r.notes.map(n => (
                        <li key={n.slug}>
                          <Link href={withLang(lang, `/notes/${n.slug}`)} prefetch={false} className="block rounded-full border border-line bg-blush px-3.5 py-1.5 text-sm font-medium text-ink hover:border-wine-600/60">
                            {noteLabel(n.name, lang)} <span className="text-xs text-smoke">({fmt(s.count, { n: n.count })})</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
