import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { listPerfumes, type PerfumeGender, type PerfumeKind } from '@/lib/load-all-perfumes';
import { fmt, getDict, LANGS, withLang, type Lang } from '@/lib/i18n';
import PerfumeGridCard from '@/app/components/PerfumeGridCard';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

const PER_PAGE = 48;

export function allPerfumesMetadata(lang: Lang, filtered: boolean): Metadata {
  const t = getDict(lang).allPerfumes;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: withLang(lang, '/perfumes'),
      languages: { ...Object.fromEntries(LANGS.map(l => [l, withLang(l, '/perfumes')])), 'x-default': '/perfumes' },
    },
    // A search, a filter or a later page is not a separate page for search engines.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

const GENDERS: PerfumeGender[] = ['all', 'male', 'female', 'unisex'];
const KINDS: PerfumeKind[] = ['all', 'originals', 'inspired'];
export const asGender = (v: string): PerfumeGender => (GENDERS as string[]).includes(v) ? (v as PerfumeGender) : 'all';
export const asKind = (v: string): PerfumeKind => (KINDS as string[]).includes(v) ? (v as PerfumeKind) : 'all';

// "All fragrances": every perfume on the site (originals and the fragrances inspired by them), 48 to a page.
export async function AllPerfumesView({ lang, q, gender, kind, page }: { lang: Lang; q: string; gender: PerfumeGender; kind: PerfumeKind; page: number }) {
  const t = getDict(lang);
  const x = t.allPerfumes;
  const { hits } = await listPerfumes({ q, gender, kind });
  const pages = Math.max(1, Math.ceil(hits.length / PER_PAGE));
  const current = Math.min(Math.max(page, 1), pages);
  const shown = hits.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const link = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (gender !== 'all') params.set('gender', gender);
    if (kind !== 'all') params.set('kind', kind);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return withLang(lang, '/perfumes') + (qs ? `?${qs}` : '');
  };
  const field = 'rounded-full border border-line bg-white px-4 py-3 outline-none focus:border-wine-600';
  const genderLabel: Record<PerfumeGender, string> = { all: t.filterAll, male: t.filterMale, female: t.filterFemale, unisex: t.filterUnisex };
  const kindLabel: Record<PerfumeKind, string> = { all: x.kindAll, originals: x.kindOriginals, inspired: x.kindInspired };

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/perfumes" />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{x.heading}</h1>
        <p className="mt-3 max-w-2xl text-smoke">{x.intro}</p>
        <div className="wine-rule my-6 w-32" />

        <form action={withLang(lang, '/perfumes')} method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{x.placeholder}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-600" aria-hidden="true" />
            <input name="q" type="search" defaultValue={q} placeholder={x.placeholder} autoComplete="off" className={`${field} w-full pe-4 ps-11`} />
          </label>
          <select name="gender" defaultValue={gender} aria-label={t.filterLabel} className={field}>
            {GENDERS.map(g => <option key={g} value={g}>{genderLabel[g]}</option>)}
          </select>
          <select name="kind" defaultValue={kind} aria-label={x.kindLabel} className={field}>
            {KINDS.map(k => <option key={k} value={k}>{kindLabel[k]}</option>)}
          </select>
          <button type="submit" className="rounded-full bg-wine-600 px-6 py-3 font-bold text-white transition hover:bg-wine-700">{x.search}</button>
        </form>

        <p className="mt-5 text-sm font-medium text-smoke" aria-live="polite">{fmt(x.count, { n: hits.length.toLocaleString('en-US') })}</p>

        {shown.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-line bg-white p-8 text-center text-smoke">{x.none}</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {shown.map((p, i) => <PerfumeGridCard key={p.id} p={p} lang={lang} index={i} />)}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3 text-sm font-bold" aria-label={fmt(t.inspiredIndex.page, { n: current, total: pages })}>
            {current > 1 && <Link href={link(current - 1)} className="rounded-full border border-line bg-white px-4 py-2 hover:border-wine-600/60">{t.inspiredIndex.prev}</Link>}
            <span className="text-smoke">{fmt(t.inspiredIndex.page, { n: current, total: pages })}</span>
            {current < pages && <Link href={link(current + 1)} className="rounded-full border border-line bg-white px-4 py-2 hover:border-wine-600/60">{t.inspiredIndex.next}</Link>}
          </nav>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
