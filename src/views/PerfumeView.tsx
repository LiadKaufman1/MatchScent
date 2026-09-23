import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getPerfumePage, type ShownPerfume } from '@/lib/load-catalog';
import { ils, usd } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from '@/app/components/Photo';
import EntryCard from '@/app/components/EntryCard';
import RatingsReviews from '@/app/components/RatingsReviews';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

export async function perfumeStaticParams() {
  const { perfumes } = await getCatalog();
  return perfumes.map(p => ({ slug: p.slug }));
}

export async function perfumeMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const t = getDict(lang);
  const data = await getPerfumePage(slug);
  if (!data) return { title: t.notFoundTitle, robots: { index: false } };

  const { perfume, entries } = data;
  const full = `${perfume.brand} ${perfume.name}`;
  const title = fmt(t.perfumeTitle, { full });
  const names = entries.slice(0, 3).map(e => `${e.brand} ${e.name}`).join(', ');
  const description = !entries.length
    ? fmt(t.perfumeDescNone, { full })
    : entries.length === 1
      ? fmt(t.perfumeDescOne, { full, names })
      : fmt(t.perfumeDescMany, { n: entries.length, full, names });

  const path = `/perfume/${perfume.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: withLang(lang, path),
      languages: { en: path, he: withLang('he', path), 'x-default': path },
    },
    // Pages with nothing on them yet are kept out of search results until they have content.
    robots: entries.length ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${title} | MatchScent`,
      description,
      type: 'website',
      url: withLang(lang, path),
      locale: lang === 'he' ? 'he_IL' : 'en_US',
    },
  };
}

function PerfumeLink({ p, lang }: { p: ShownPerfume; lang: Lang }) {
  const t = getDict(lang);
  return (
    <Link
      href={withLang(lang, `/perfume/${p.slug}`)}
      prefetch={false}
      className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 transition hover:border-wine-600/50"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{p.brand}</span>
        <span className="block truncate text-base font-bold text-ink">{p.name}</span>
      </span>
      <span className="shrink-0 text-xs text-smoke group-hover:text-wine-600">
        {p.entryCount > 0 ? fmt(t.similarBadge, { n: p.entryCount }) : t.soon}
      </span>
    </Link>
  );
}

export default async function PerfumeView({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const data = await getPerfumePage(slug);
  if (!data) notFound();

  const { perfume, entries, sameBrand, more, community } = data;
  const full = `${perfume.brand} ${perfume.name}`;
  const path = `/perfume/${perfume.slug}`;
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'MatchScent', item: `${base}${withLang(lang, '/')}` },
          { '@type': 'ListItem', position: 2, name: full, item: `${base}${withLang(lang, path)}` },
        ],
      },
      ...(entries.length
        ? [{
            '@type': 'ItemList',
            name: fmt(t.inspiredHeading, { name: full }),
            itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: `${e.brand} ${e.name}` })),
          }]
        : []),
    ],
  };

  const audience =
    perfume.gender === 'male' ? t.audForMen : perfume.gender === 'female' ? t.audForWomen : t.audForAll;
  const audienceLabel =
    perfume.gender === 'male' ? t.audMale : perfume.gender === 'female' ? t.audFemale : t.audUnisex;
  const intro = [
    fmt(t.introBase, { name: perfume.name, brand: perfume.brand, audience }),
    entries.length === 0 ? t.introNone : entries.length === 1 ? t.introWithOne : fmt(t.introWithMany, { n: entries.length }),
    t.introPrices,
  ].join(' ');

  return (
    <div className="site">
      <script
        type="application/ld+json"
        // "<" is escaped so the data can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <SiteHeader lang={lang} path={path} />

      <main className="mx-auto max-w-5xl px-4 pb-8 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-xs font-medium uppercase tracking-[0.12em] text-smoke">
          <Link href={withLang(lang, '/')} className="transition hover:text-wine-600">{t.home}</Link>
          <span className="mx-2 text-wine-200" aria-hidden="true">/</span>
          <span className="text-ink/80">{full}</span>
        </nav>

        <header className="rise mt-8 grid gap-8 md:grid-cols-[16rem_1fr] md:items-center">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[16rem] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(28,21,24,0.04)] md:mx-0">
            <Photo url={perfume.image_url} alt={full} seed={perfume.brand + perfume.name} sizes="256px" priority />
          </div>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-wine-600">{perfume.brand}</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">{perfume.name}</h1>
            <div className="wine-rule my-6 w-32" />
            <p className="max-w-xl leading-relaxed text-smoke">{intro}</p>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {usd(perfume.price_usd) && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-smoke">{t.originalFrom}</dt>
                  <dd className="font-bold text-ink" dir="ltr">
                    {usd(perfume.price_usd)}
                    {ils(perfume.price_ils) && <span className="ms-2 font-medium text-smoke">{ils(perfume.price_ils)}</span>}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-smoke">{t.audience}</dt>
                <dd className="font-bold text-ink">{audienceLabel}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="mt-14" aria-labelledby="inspired-heading">
          <h2 id="inspired-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
            {fmt(t.inspiredHeading, { name: perfume.name })}
          </h2>
          {entries.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white py-12 text-center text-smoke">{t.curatingSimilar}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {entries.map(e => <EntryCard key={e.id} entry={e} lang={lang} />)}
            </div>
          )}
        </section>

        {sameBrand.length > 0 && (
          <section className="mt-14" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
              {fmt(t.moreFrom, { brand: perfume.brand })}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sameBrand.map(p => <PerfumeLink key={p.id} p={p} lang={lang} />)}
            </div>
          </section>
        )}

        <RatingsReviews
          lang={lang}
          perfumeId={perfume.id}
          average={community.average}
          count={community.count}
          reviews={community.reviews}
        />

        {more.length > 0 && (
          <section className="mt-14" aria-labelledby="more-heading">
            <h2 id="more-heading" className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-wine-600">
              {t.keepExploring}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {more.map(p => <PerfumeLink key={p.id} p={p} lang={lang} />)}
            </div>
          </section>
        )}
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
