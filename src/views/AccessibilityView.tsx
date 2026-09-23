import type { Metadata } from 'next';
import { getDict, LANGS, withLang, type Lang } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

export function accessibilityMetadata(lang: Lang): Metadata {
  const t = getDict(lang);
  return {
    title: t.st.title,
    description: t.st.intro,
    alternates: {
      canonical: withLang(lang, '/accessibility'),
      languages: Object.fromEntries(LANGS.map(l => [l, withLang(l, '/accessibility')])),
    },
  };
}

// The accessibility statement (a legal requirement for many Israeli websites).
export default function AccessibilityView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  // Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel to show a contact address here.
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/accessibility" />
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">{t.st.title}</h1>
        <div className="wine-rule my-6 w-32" />
        <p className="leading-relaxed text-smoke">{t.st.intro}</p>

        <h2 className="mb-3 mt-10 text-xl font-bold text-ink">{t.st.doneTitle}</h2>
        <ul className="list-disc space-y-2 ps-6 leading-relaxed text-smoke">
          {t.st.done.map(item => <li key={item}>{item}</li>)}
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-bold text-ink">{t.st.limitsTitle}</h2>
        <p className="leading-relaxed text-smoke">{t.st.limits}</p>

        <h2 className="mb-3 mt-10 text-xl font-bold text-ink">{t.st.contactTitle}</h2>
        <p className="leading-relaxed text-smoke">{t.st.contact}</p>
        {email && (
          <p className="mt-3 text-smoke">
            {t.st.contactEmail}:{' '}
            <a href={`mailto:${email}`} className="font-bold text-wine-700 underline underline-offset-4" dir="ltr">{email}</a>
          </p>
        )}

        <p className="mt-10 text-sm text-smoke/80">{t.st.updated}</p>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
