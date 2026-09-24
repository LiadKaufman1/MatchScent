import { getCatalog } from '@/lib/load-catalog';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import Catalog from '@/app/components/Catalog';
import CountrySelect from '@/app/components/CountrySelect';
import AuthStatus from '@/app/components/AuthStatus';
import CommunityHighlights from '@/app/components/CommunityHighlights';
import Link from 'next/link';
import { LanguageSwitch, SiteFooter, Wordmark } from '@/app/components/SiteChrome';

// The home page, in either language.
export default async function HomeView({ lang }: { lang: Lang }) {
  const { perfumes } = await getCatalog();
  const t = getDict(lang);

  return (
    <div className="site">
      <main>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2 px-4 pt-4 sm:px-6">
          <Link href={withLang(lang, '/top')} className="text-xs font-bold uppercase tracking-[0.14em] text-smoke transition hover:text-wine-600">{t.nav.top}</Link>
          <LanguageSwitch lang={lang} path="/" />
          <CountrySelect lang={lang} />
          <AuthStatus lang={lang} />
        </div>
        <section className="hero-glow relative overflow-hidden px-6 pb-12 pt-10 text-center sm:pt-16">
          <div className="rise mx-auto max-w-3xl">
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em] text-wine-600">{t.brandTag}</p>
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl">
              <Wordmark />
            </h1>
            <div className="wine-rule mx-auto my-8 w-40" />
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-smoke sm:text-xl">{t.heroSub}</p>
          </div>
        </section>

        <CommunityHighlights lang={lang} />

        <Catalog perfumes={perfumes} lang={lang} />
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
