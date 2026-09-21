import Link from 'next/link';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

export default function NotFoundView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <div className="site">
      <SiteHeader lang={lang} path="/" />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-7xl font-extrabold text-wine-600" dir="ltr">404</p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">{t.notFoundTitle}</h1>
        <p className="mt-3 text-smoke">{t.notFoundText}</p>
        <Link
          href={withLang(lang, '/')}
          className="mt-8 inline-flex rounded-xl bg-wine-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-wine-700"
        >
          {t.backHome}
        </Link>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
