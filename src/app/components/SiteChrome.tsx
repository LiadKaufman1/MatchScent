import Link from 'next/link';
import { Search } from 'lucide-react';
import { getDict, otherLang, withLang, type Lang } from '@/lib/i18n';
import CountrySelect from './CountrySelect';
import AuthStatus from './AuthStatus';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display ${className}`} dir="ltr">
      Match<span className="text-wine-600">Scent</span>
    </span>
  );
}

// Switches between the English and Hebrew version of the SAME page.
// `path` is the page without the language prefix, e.g. "/" or "/perfume/creed-aventus".
export function LanguageSwitch({ lang, path }: { lang: Lang; path: string }) {
  const t = getDict(lang);
  const other = otherLang(lang);
  return (
    <a
      href={withLang(other, path)}
      hrefLang={other}
      lang={other}
      aria-label={t.switchLabel}
      className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ink shadow-[0_1px_2px_rgba(28,21,24,0.04)] transition hover:border-wine-600 hover:text-wine-700"
    >
      {t.switchTo}
    </a>
  );
}

const navLink = 'text-xs font-bold uppercase tracking-[0.14em] text-smoke transition hover:text-wine-600';

export function SiteHeader({ lang, path }: { lang: Lang; path: string }) {
  const t = getDict(lang);
  return (
    <header className="border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-6">
        <Link href={withLang(lang, '/')} aria-label="MatchScent" className="shrink-0">
          <Wordmark className="text-2xl font-extrabold" />
        </Link>
        <nav aria-label="MatchScent" className="flex items-center gap-4">
          <Link href={withLang(lang, '/') + '#catalog'} className={`hidden md:inline ${navLink}`}>{t.allFragrances}</Link>
          <Link href={withLang(lang, '/top')} className={navLink}>{t.nav.top}</Link>
          <Link href={withLang(lang, '/suggest')} className={`hidden lg:inline ${navLink}`}>{t.nav.suggest}</Link>
        </nav>
        <Link
          href={withLang(lang, '/search')}
          className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-[#FCFAF9] px-4 py-2 text-sm text-smoke transition hover:border-wine-600/50 md:flex md:max-w-xs"
        >
          <Search className="h-4 w-4 shrink-0 text-wine-600" aria-hidden="true" />
          <span className="truncate">{t.hero.searchLabel}</span>
        </Link>
        <div className="ms-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link href={withLang(lang, '/search')} aria-label={t.nav.search} title={t.nav.search} className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-wine-600 md:hidden">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
          <LanguageSwitch lang={lang} path={path} />
          <CountrySelect lang={lang} />
          <AuthStatus lang={lang} />
        </div>
      </div>
    </header>
  );
}

const footLink = 'text-sm text-white/75 transition hover:text-white';

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const f = t.footerNav;
  return (
    <footer className="mt-24 bg-plum-900 px-6 pb-24 pt-14 text-white sm:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="text-3xl font-extrabold" dir="ltr">
            Match<span className="text-wine-200">Scent</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{t.heroSub}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-wine-200">{f.explore}</p>
          <ul className="space-y-2">
            <li><Link href={withLang(lang, '/') + '#catalog'} className={footLink}>{t.allFragrances}</Link></li>
            <li><Link href={withLang(lang, '/top')} className={footLink}>{t.nav.top}</Link></li>
            <li><Link href={withLang(lang, '/search')} className={footLink}>{t.nav.search}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-wine-200">{f.community}</p>
          <ul className="space-y-2">
            <li><Link href={withLang(lang, '/register')} className={footLink}>{t.auth.registerCta}</Link></li>
            <li><Link href={withLang(lang, '/login')} className={footLink}>{t.auth.loginCta}</Link></li>
            <li><Link href={withLang(lang, '/suggest')} className={footLink}>{t.nav.suggest}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-wine-200">{f.about}</p>
          <ul className="space-y-2">
            <li><Link href={withLang(lang, '/accessibility')} className={footLink}>{t.footerA11y}</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-white/15 pt-6">
        <p className="text-xs leading-relaxed text-white/60">{t.footer}</p>
      </div>
    </footer>
  );
}
