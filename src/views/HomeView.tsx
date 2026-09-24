import { getCatalog } from '@/lib/load-catalog';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import Catalog from '@/app/components/Catalog';
import CommunityHighlights from '@/app/components/CommunityHighlights';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { SiteFooter, SiteHeader, Wordmark } from '@/app/components/SiteChrome';
import { noteLabel } from '@/lib/notes';
import { slugify } from '@/lib/slug';

// Notes offered as quick links under the home page search.
const POPULAR_NOTES = ['Vanilla', 'Agarwood (Oud)', 'Rose', 'Amber', 'Leather', 'Bergamot'];

// The home page, in either language.
export default async function HomeView({ lang }: { lang: Lang }) {
  const { perfumes } = await getCatalog();
  const t = getDict(lang);

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/" />
      <main>
        <section className="hero-glow relative overflow-hidden px-6 pb-14 pt-12 text-center sm:pt-16">
          <div className="rise mx-auto max-w-3xl">
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em] text-wine-600">{t.brandTag}</p>
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl">
              <Wordmark />
            </h1>
            <div className="wine-rule mx-auto my-8 w-40" />
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-smoke sm:text-xl">{t.heroSub}</p>

            <form action={withLang(lang, '/search')} method="get" role="search" className="relative mx-auto mt-9 max-w-xl">
              <label htmlFor="hero-search" className="sr-only">{t.hero.searchLabel}</label>
              <Search className="pointer-events-none absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-wine-600" aria-hidden="true" />
              <input
                id="hero-search"
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t.search.placeholder}
                className="w-full rounded-full border border-line bg-white py-4 pe-28 ps-14 text-base text-ink shadow-[0_10px_30px_-18px_rgba(126,31,55,0.45)] outline-none transition placeholder:text-smoke/70 focus:border-wine-600"
              />
              <button type="submit" className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-wine-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-wine-700">
                {t.search.submit}
              </button>
            </form>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-smoke">{t.hero.popular}</span>
              {POPULAR_NOTES.map(n => (
                <Link key={n} href={withLang(lang, `/notes/${slugify(n)}`)} className="rounded-full border border-line bg-white px-3 py-1 font-medium text-ink transition hover:border-wine-600/50">
                  {noteLabel(n, lang)}
                </Link>
              ))}
              <a href="#catalog" className="rounded-full px-3 py-1 font-bold text-wine-600 underline underline-offset-4">{t.hero.browse}</a>
            </p>
          </div>
        </section>

        <CommunityHighlights lang={lang} />

        <div id="catalog" className="scroll-mt-4">
          <h2 className="mb-6 px-4 text-center text-3xl font-extrabold text-ink">{t.allFragrances}</h2>
          <Catalog perfumes={perfumes} lang={lang} />
        </div>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
