import type { Metadata, Viewport } from 'next';
import { siteUrl } from './site';
import { getDict, LANGS, withLang, type Lang } from './i18n';

// Page title/description settings shared by the English and Hebrew versions.
export function siteMetadata(lang: Lang): Metadata {
  const t = getDict(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.metaTitle, template: '%s | MatchScent' },
    description: t.metaDescription,
    alternates: {
      canonical: withLang(lang, '/'),
      languages: { ...Object.fromEntries(LANGS.map(l => [l, withLang(l, '/')])), 'x-default': '/' },
    },
    openGraph: { siteName: 'MatchScent', type: 'website', locale: lang === 'he' ? 'he_IL' : 'en_US' },
  };
}

export const siteViewport: Viewport = {
  themeColor: '#FBF9F7',
};
