import type { Metadata } from 'next';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';
import AuthForm from '@/app/components/AuthForm';

export function authMetadata(lang: Lang, mode: 'login' | 'register'): Metadata {
  const t = getDict(lang);
  const path = mode === 'login' ? '/login' : '/register';
  return {
    title: mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle,
    robots: { index: false, follow: true }, // account pages have nothing for search engines to show
    alternates: { canonical: withLang(lang, path) },
  };
}

export default function AuthView({ lang, mode }: { lang: Lang; mode: 'login' | 'register' }) {
  const t = getDict(lang);
  const path = mode === 'login' ? '/login' : '/register';

  return (
    <div className="site">
      <SiteHeader lang={lang} path={path} />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center text-3xl font-extrabold text-ink">
          {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
        </h1>
        <AuthForm lang={lang} mode={mode} />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
