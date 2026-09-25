import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDict, LANGS, withLang, type Lang } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';
import ReportForm from '@/app/components/ReportForm';

const alternates = (lang: Lang, path: string) => ({
  canonical: withLang(lang, path),
  languages: Object.fromEntries(LANGS.map(l => [l, withLang(l, path)])),
});

export function aboutMetadata(lang: Lang): Metadata {
  const t = getDict(lang).about;
  return { title: t.title, description: t.description, alternates: alternates(lang, '/about') };
}

export function reportMetadata(lang: Lang): Metadata {
  const t = getDict(lang).report;
  // The form itself is not something to find in a search engine.
  return { title: t.title, description: t.description, alternates: alternates(lang, '/report'), robots: { index: false, follow: true } };
}

// About the site and the person behind it.
export function AboutView({ lang }: { lang: Lang }) {
  const t = getDict(lang).about;
  // Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel to show a contact address here.
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/about" />
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">{t.title}</h1>
        <div className="wine-rule my-6 w-32" />
        <p className="text-lg leading-relaxed text-smoke">{t.intro}</p>

        <h2 className="mb-4 mt-12 text-2xl font-extrabold text-ink">{t.whatTitle}</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {t.what.map(item => (
            <li key={item.title} className="rounded-2xl border border-line bg-white p-5">
              <p className="font-extrabold text-ink">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{item.text}</p>
            </li>
          ))}
        </ul>

        <h2 className="mb-3 mt-12 text-2xl font-extrabold text-ink">{t.whoTitle}</h2>
        <div className="space-y-3 leading-relaxed text-smoke">
          {t.who.map(p => <p key={p}>{p}</p>)}
        </div>

        <h2 className="mb-3 mt-12 text-2xl font-extrabold text-ink">{t.honestTitle}</h2>
        <ul className="list-disc space-y-2 ps-6 leading-relaxed text-smoke">
          {t.honest.map(p => <li key={p}>{p}</li>)}
        </ul>

        <section className="mt-12 rounded-2xl border border-wine-600/30 bg-blush/60 p-6">
          <h2 className="text-xl font-extrabold text-ink">{t.helpTitle}</h2>
          <p className="mt-2 leading-relaxed text-smoke">{t.help}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={withLang(lang, '/report')} className="rounded-full bg-wine-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-wine-700">{t.reportCta}</Link>
            {email && (
              <span className="text-sm text-smoke">
                {t.emailLabel}{' '}
                <a href={`mailto:${email}`} className="font-bold text-wine-700 underline underline-offset-4" dir="ltr">{email}</a>
              </span>
            )}
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

// "Report a problem": a short form; what is written is saved for the owner (see /admin/reports).
export function ReportView({ lang }: { lang: Lang }) {
  const t = getDict(lang).report;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/report" />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">{t.title}</h1>
        <div className="wine-rule my-6 w-32" />
        <p className="mb-6 leading-relaxed text-smoke">{t.intro}</p>
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-blush" aria-hidden="true" />}>
          <ReportForm lang={lang} email={email} />
        </Suspense>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
