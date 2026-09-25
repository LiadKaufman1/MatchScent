import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { entryKey, getCatalog, getPerfumePage, hasContent, isFeatured, type ShownPerfume } from '@/lib/load-catalog';
import { buildsWholeSite } from '@/lib/site';
import StoreButtons from '@/app/components/StoreButtons';
import { ils, usd } from '@/lib/format';
import { slugify } from '@/lib/slug';
import { siteUrl } from '@/lib/site';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from '@/app/components/Photo';
import EntryCard from '@/app/components/EntryCard';
import Reviews from '@/app/components/Reviews';
import UserRatings from '@/app/components/UserRatings';
import ProsCons from '@/app/components/ProsCons';
import NotePyramid from '@/app/components/NotePyramid';
import { noteGroups } from '@/lib/notes';
import { similarByNotes } from '@/lib/search';
import ShelfButtons from '@/app/components/ShelfButtons';
import PhotoGallery from '@/app/components/PhotoGallery';
import SuggestForm from '@/app/components/SuggestForm';
import AccordBars from '@/app/components/AccordBars';
import SectionNav from '@/app/components/SectionNav';
import { Star } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';
import HoverLink from '@/app/components/HoverLink';

export async function perfumeStaticParams(lang: Lang = 'he') {
  const { perfumes } = await getCatalog();
  // The live Hebrew site builds ahead of time every perfume page that has content (similar scents, an original it is
  // inspired by, or notes): a page that had to be rendered on its first visit took 2-3 seconds to open. Perfumes that
  // are only a name (thousands) and everything on English / preview builds are built on the first visit.
  return perfumes.filter(buildsWholeSite(lang) ? hasContent : isFeatured).map(p => ({ slug: p.slug }));
}

export async function perfumeMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const t = getDict(lang);
  const data = await getPerfumePage(slug);
  if (!data) return { title: t.notFoundTitle, robots: { index: false } };

  const { perfume, entries, inspiredBy } = data;
  const full = `${perfume.brand} ${perfume.name}`;
  const isInspired = entries.length === 0 && inspiredBy.length > 0;
  const orig = inspiredBy.map(x => `${x.original.brand} ${x.original.name}`).slice(0, 2).join(', ');
  const title = isInspired ? fmt(t.inspiredPage.titleOne, { full, orig }) : fmt(t.perfumeTitle, { full });
  const names = entries.slice(0, 3).map(e => `${e.brand} ${e.name}`).join(', ');
  const description = isInspired
    ? fmt(t.inspiredPage.description, { full, orig })
    : !entries.length
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
      languages: { he: withLang('he', path), en: withLang('en', path), 'x-default': path },
    },
    // Pages with nothing on them yet (no similar scents, no notes) stay out of search results until they have content.
    robots: entries.length || isInspired || noteGroups(perfume.note_pyramid).length ? undefined : { index: false, follow: true },
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
    <HoverLink
      href={withLang(lang, `/perfume/${p.slug}`)}
      className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 transition hover:border-wine-600/50"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{p.brand}</span>
        <span className="block truncate text-base font-bold text-ink">{p.name}</span>
      </span>
      <span className="shrink-0 text-xs text-smoke group-hover:text-wine-600">
        {p.entryCount > 0 ? fmt(t.similarBadge, { n: p.entryCount }) : p.inspiredOf.length ? '' : t.soon}
      </span>
    </HoverLink>
  );
}

export default async function PerfumeView({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const data = await getPerfumePage(slug);
  if (!data) notFound();

  const { perfume, entries, inspiredBy, siblings, sameBrand, more, community } = data;
  const isInspired = entries.length === 0 && inspiredBy.length > 0;
  const orig = inspiredBy.map(x => `${x.original.brand} ${x.original.name}`).slice(0, 2).join(', ');
  const alike = await similarByNotes(perfume);
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
  const intro = (isInspired
    ? [fmt(t.inspiredPage.intro, { name: perfume.name, brand: perfume.brand, orig }), t.introPrices]
    : [
        fmt(t.introBase, { name: perfume.name, brand: perfume.brand, audience }),
        entries.length === 0 ? t.introNone : entries.length === 1 ? t.introWithOne : fmt(t.introWithMany, { n: entries.length }),
        t.introPrices,
      ]).join(' ');

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

        <header className="rise mt-6 grid grid-cols-[7.5rem_1fr] items-center gap-x-5 gap-y-5 md:grid-cols-[18rem_1fr] md:items-start md:gap-x-10">
          <div className="w-full md:row-span-2">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-line bg-white shadow-[0_18px_40px_-28px_rgba(28,21,24,0.45)]">
              <Photo url={perfume.image_url} alt={full} seed={perfume.brand + perfume.name} sizes="288px" priority />
            </div>
          </div>
          <div className="min-w-0 md:self-end">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-wine-600">
              <Link href={withLang(lang, `/brand/${slugify(perfume.brand)}`)} prefetch={false} className="transition hover:text-wine-700">{perfume.brand}</Link>
            </p>
            <h1 className="mt-1.5 text-3xl font-extrabold leading-tight text-ink sm:text-5xl">{perfume.name}</h1>
            <p className="mt-2 text-sm text-smoke">
              {[audienceLabel, perfume.year ? String(perfume.year) : null, perfume.perfumers?.length ? perfume.perfumers.join(', ') : null].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2">
            {/* The main action of the site: where is it cheapest to buy it. */}
            <div className="max-w-md">
              <StoreButtons brand={perfume.brand} name={perfume.name} lang={lang} variant="hero" />
            </div>

            {/* The community's verdict at a glance (like the score next to the name on Parfumo). */}
            <a href="#panels-heading" className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-2.5 transition hover:border-wine-600/50">
              <Star className="h-6 w-6 fill-wine-600 text-wine-600" aria-hidden="true" />
              {community.count > 0 ? (
                <span className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-ink" dir="ltr">{community.average.toFixed(1)}</span>
                  <span className="text-sm text-smoke">{t.perfumeHead.outOf}</span>
                  <span className="text-sm text-smoke">· {fmt(t.perfumeHead.votes, { n: community.count })}</span>
                  {community.reviews.length > 0 && <span className="text-sm text-smoke">· {fmt(t.perfumeHead.reviews, { n: community.reviews.length })}</span>}
                </span>
              ) : (
                <span className="text-sm">
                  <span className="font-bold text-ink">{t.perfumeHead.noRatings}</span>
                  <span className="ms-2 font-bold text-wine-600 underline underline-offset-4">{t.perfumeHead.rateIt}</span>
                </span>
              )}
            </a>

            <p className="mt-5 max-w-xl leading-relaxed text-smoke">{intro}</p>

            {!isInspired && usd(perfume.price_usd) && (
              <p className="mt-4 text-sm">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-smoke">{t.originalFrom}</span>{' '}
                <span className="font-bold text-ink" dir="ltr">
                  {usd(perfume.price_usd)}
                  {ils(perfume.price_ils) && <span className="ms-2 font-medium text-smoke">{ils(perfume.price_ils)}</span>}
                </span>
              </p>
            )}

            {perfume.accords && perfume.accords.length > 0 && (
              <AccordBars accords={perfume.accords} lang={lang} title={t.facts.accords} />
            )}
            <ShelfButtons lang={lang} perfumeId={perfume.id} own={community.shelf.own} want={community.shelf.want} />
          </div>
        </header>

        {inspiredBy.length > 0 && (
          <section className="mt-10" aria-labelledby="inspired-by-heading">
            <h2 id="inspired-by-heading" className="mb-5 section-title">{isInspired ? t.inspiredPage.heading : t.inspiredPage.headingReminds}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {inspiredBy.map(({ original, rank, of }) => (
                <Link
                  key={original.id}
                  href={withLang(lang, `/perfume/${original.slug}`)}
                  className="group flex items-center gap-4 rounded-2xl border border-wine-600/30 bg-white p-4 transition hover:border-wine-600 hover:shadow-[0_10px_30px_-20px_rgba(126,31,55,0.6)]"
                >
                  <span className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                    <Photo url={original.image_url} alt={`${original.brand} ${original.name}`} seed={original.brand + original.name} sizes="72px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{original.brand}</span>
                    <span className="block text-lg font-extrabold leading-tight text-ink group-hover:text-wine-700">{original.name}</span>
                    {rank ? <span className="mt-1 block text-xs text-smoke">{fmt(t.inspiredPage.rank, { rank, of, name: original.name })}</span> : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <SectionNav
          label={t.perfumeHead.sections}
          items={[
            ...(inspiredBy.length ? [{ id: 'inspired-by-heading', label: t.inspiredPage.heading }] : []),
            ...(noteGroups(perfume.note_pyramid).length ? [{ id: 'notes-heading', label: t.perfumeHead.navNotes }] : []),
            ...(entries.length || !isInspired ? [{ id: 'inspired-heading', label: t.perfumeHead.navInspired }] : []),
            { id: 'photos-heading', label: t.perfumeHead.navPhotos },
            { id: 'panels-heading', label: t.perfumeHead.navRatings },
            { id: 'reviews-heading', label: t.perfumeHead.navReviews },
          ]}
        />

        <NotePyramid pyramid={perfume.note_pyramid} lang={lang} noteVotes={community.noteVotes} />

        {!isInspired && (
        <section className="mt-14" aria-labelledby="inspired-heading">
          <h2 id="inspired-heading" className="mb-5 section-title">
            {fmt(t.inspiredHeading, { name: perfume.name })}
          </h2>
          {entries.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white py-12 text-center text-smoke">{t.curatingSimilar}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {entries.map(e => (
                <EntryCard key={e.id} entry={e} lang={lang} perfumeId={perfume.id} votes={community.entryVotes[entryKey(e.brand, e.name)]} />
              ))}
            </div>
          )}
          <div className="mt-4">
            <SuggestForm lang={lang} kind="similar" perfumeId={perfume.id} compact />
          </div>
        </section>
        )}

        {siblings.length > 0 && (
          <section className="mt-14" aria-labelledby="siblings-heading">
            <h2 id="siblings-heading" className="mb-5 section-title">{fmt(t.inspiredPage.siblings, { name: inspiredBy[0]?.original.name ?? '' })}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map(s => {
                const inner = (
                  <>
                    <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                      <Photo url={s.image_url} alt={`${s.brand} ${s.name}`} seed={s.brand + s.name} sizes="64px" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{s.brand}</span>
                      <span className="block truncate font-bold text-ink">{s.name}</span>
                    </span>
                  </>
                );
                return (
                  <li key={s.id}>
                    {s.perfumeSlug ? (
                      <HoverLink href={withLang(lang, `/perfume/${s.perfumeSlug}`)} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition hover:border-wine-600/50">{inner}</HoverLink>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <PhotoGallery lang={lang} perfumeId={perfume.id} photos={community.photos} alt={full} />

        <UserRatings
          lang={lang}
          perfumeId={perfume.id}
          average={community.average}
          ratingCounts={community.ratingCounts}
          votes={community.votes}
          aspects={community.aspects}
        />

        <ProsCons lang={lang} perfumeId={perfume.id} points={community.points} />

        <Reviews lang={lang} perfumeId={perfume.id} reviews={community.reviews} />

        {alike.length > 0 && (
          <section className="mt-14" aria-labelledby="alike-heading">
            <h2 id="alike-heading" className="mb-5 section-title">
              {t.similarByNotes}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alike.map(p => <PerfumeLink key={p.id} p={p} lang={lang} />)}
            </div>
          </section>
        )}

        {sameBrand.length > 0 && (
          <section className="mt-14" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="mb-5 section-title">
              {fmt(t.moreFrom, { brand: perfume.brand })}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sameBrand.map(p => <PerfumeLink key={p.id} p={p} lang={lang} />)}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="mt-14" aria-labelledby="more-heading">
            <h2 id="more-heading" className="mb-5 section-title">
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
