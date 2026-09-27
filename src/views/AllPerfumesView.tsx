import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { listBrandsForFilter, listPerfumes, type PerfumeGender, type PerfumeKind } from '@/lib/load-all-perfumes';
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
const KINDS: PerfumeKind[] = ['all', 'originals'];
export const asGender = (v: string): PerfumeGender => (GENDERS as string[]).includes(v) ? (v as PerfumeGender) : 'all';
export const asKind = (v: string): PerfumeKind => (KINDS as string[]).includes(v) ? (v as PerfumeKind) : 'all';

// A filter with its own visible caption above it (so it is clear what the control changes, not just its current value).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{label}</span>
      {children}
    </label>
  );
}

// "All fragrances": every perfume on the site (originals and the fragrances inspired by them), 48 to a page.
// Similar scents ("Inspired") have their own filter and index at /inspired, so the type filter here only chooses
// between everything and originals only.
export async function AllPerfumesView({ lang, q, gender, kind, brand, page }: { lang: Lang; q: string; gender: PerfumeGender; kind: PerfumeKind; brand: string; page: number }) {
  const t = getDict(lang);
  const x = t.allPerfumes;
  const [{ hits }, brands] = await Promise.all([listPerfumes({ q, gender, kind, brand }), listBrandsForFilter()]);
  const brandName = brand ? brands.find(b => b.slug === brand)?.name : null;
  const pages = Math.max(1, Math.ceil(hits.length / PER_PAGE));
  const current = Math.min(Math.max(page, 1), pages);
  const shown = hits.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const link = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (gender !== 'all') params.set('gender', gender);
    if (kind !== 'all') params.set('kind', kind);
    if (brand) params.set('brand', brand);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return withLang(lang, '/perfumes') + (qs ? `?${qs}` : '');
  };
  const field = 'w-full rounded-full border border-line bg-white px-4 py-3 outline-none focus:border-wine-600';
  const genderLabel: Record<PerfumeGender, string> = { all: t.filterAll, male: t.filterMale, female: t.filterFemale, unisex: t.filterUnisex };
  const kindLabel: Record<PerfumeKind, string> = { all: x.kindAll, originals: x.kindOriginals };

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/perfumes" />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{x.heading}</h1>
        <p className="mt-3 max-w-2xl text-smoke">{x.intro}</p>
        <div className="wine-rule my-6 w-32" />

        <form action={withLang(lang, '/perfumes')} method="get" role="search" className="space-y-3">
          <Field label={x.searchLabel}>
            <span className="relative block">
              <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wine-600" aria-hidden="true" />
              <input name="q" type="search" defaultValue={q} placeholder={x.placeholder} autoComplete="off" className={`${field} pe-4 ps-11`} />
            </span>
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40 shrink-0">
              <Field label={t.filterLabel}>
                <select name="gender" defaultValue={gender} className={field}>
                  {GENDERS.map(g => <option key={g} value={g}>{genderLabel[g]}</option>)}
                </select>
              </Field>
            </div>
            <div className="w-52 shrink-0">
              <Field label={x.brandLabel}>
                <select name="brand" defaultValue={brand} className={field}>
                  <option value="">{x.brandAll}</option>
                  {brands.map(b => <option key={b.slug} value={b.slug}>{b.name} ({b.count})</option>)}
                </select>
              </Field>
            </div>
            <div className="w-40 shrink-0">
              <Field label={x.kindLabel}>
                <select name="kind" defaultValue={kind} className={field}>
                  {KINDS.map(k => <option key={k} value={k}>{kindLabel[k]}</option>)}
                </select>
              </Field>
            </div>
            <button type="submit" className="h-[46px] rounded-full bg-wine-600 px-6 font-bold text-white transition hover:bg-wine-700">{x.apply}</button>
          </div>
        </form>

        <p className="mt-5 text-sm font-medium text-smoke" aria-live="polite">
          {fmt(x.count, { n: hits.length.toLocaleString('en-US') })}
          {brandName && <> · {brandName}</>}
        </p>

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
