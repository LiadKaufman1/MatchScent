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

export function SiteHeader({ lang, path }: { lang: Lang; path: string }) {
  const t = getDict(lang);
  return (
    <header className="border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href={withLang(lang, '/')} aria-label="MatchScent">
          <Wordmark className="text-2xl font-extrabold" />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:gap-x-4">
          <Link
            href={withLang(lang, '/')}
            className="hidden text-xs font-bold uppercase tracking-[0.14em] text-smoke transition hover:text-wine-600 md:inline"
          >
            {t.allFragrances}
          </Link>
          <Link
            href={withLang(lang, '/top')}
            className="text-xs font-bold uppercase tracking-[0.14em] text-smoke transition hover:text-wine-600"
          >
            {t.nav.top}
          </Link>
          <Link href={withLang(lang, '/search')} aria-label={t.nav.search} title={t.nav.search} className="text-smoke transition hover:text-wine-600">
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

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <footer className="mt-24 bg-plum-900 px-6 pb-24 pt-12 text-center sm:pb-12">
      <p className="text-3xl font-extrabold text-white" dir="ltr">
        Match<span className="text-wine-200">Scent</span>
      </p>
      <div className="mx-auto my-5 h-px w-16 bg-wine-200/40" />
      <p className="mx-auto max-w-2xl text-xs leading-relaxed text-white/70">{t.footer}</p>
      <p className="mt-4 text-xs">
        <Link href={withLang(lang, '/accessibility')} className="font-medium text-white/80 underline underline-offset-4 transition hover:text-white">
          {t.footerA11y}
        </Link>
      </p>
    </footer>
  );
}
