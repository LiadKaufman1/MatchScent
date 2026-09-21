import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getPerfumePage, type ShownPerfume } from '@/lib/load-catalog';
import { audienceLabel, ils, usd } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import Photo from '../../components/Photo';
import EntryCard from '../../components/EntryCard';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

// Built ahead of time, refreshed in the background at most every 5 minutes.
// A perfume added later gets its page the first time someone visits it.
export const revalidate = 300;

export async function generateStaticParams() {
  const { perfumes } = await getCatalog();
  return perfumes.map(p => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPerfumePage(slug);
  if (!data) return { title: 'Fragrance not found', robots: { index: false } };

  const { perfume, entries } = data;
  const full = `${perfume.brand} ${perfume.name}`;
  const title = `Fragrances Inspired by ${full}`;
  const names = entries.slice(0, 3).map(e => `${e.brand} ${e.name}`).join(', ');
  const description = entries.length
    ? `Discover ${entries.length} fragrance${entries.length === 1 ? '' : 's'} inspired by ${full}, including ${names}. Compare and find where to buy.`
    : `We are curating fragrances inspired by ${full}. Check back soon.`;

  return {
    title,
    description,
    alternates: { canonical: `/perfume/${perfume.slug}` },
    // Pages with nothing on them yet are kept out of search results until they have content.
    robots: entries.length ? undefined : { index: false, follow: true },
    openGraph: { title: `${title} | MatchScent`, description, type: 'website', url: `/perfume/${perfume.slug}` },
  };
}

function PerfumeLink({ p }: { p: ShownPerfume }) {
  return (
    <Link
      href={`/perfume/${p.slug}`}
      prefetch={false}
      className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 transition hover:border-wine-600/50"
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-wine-600">{p.brand}</span>
        <span className="block truncate font-display text-lg font-semibold text-ink">{p.name}</span>
      </span>
      <span className="shrink-0 text-xs text-smoke group-hover:text-wine-600">
        {p.entryCount > 0 ? `${p.entryCount} similar` : 'Soon'}
      </span>
    </Link>
  );
}

export default async function PerfumePage({ params }: Props) {
  const { slug } = await params;
  const data = await getPerfumePage(slug);
  if (!data) notFound();

  const { perfume, entries, sameBrand, more } = data;
  const full = `${perfume.brand} ${perfume.name}`;
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'MatchScent', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: full, item: `${base}/perfume/${perfume.slug}` },
        ],
      },
      ...(entries.length
        ? [{
            '@type': 'ItemList',
            name: `Fragrances inspired by ${full}`,
            itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: `${e.brand} ${e.name}` })),
          }]
        : []),
    ],
  };

  const audience =
    perfume.gender === 'male' ? 'men' : perfume.gender === 'female' ? 'women' : 'everyone';

  return (
    <div className="site">
      <script
        type="application/ld+json"
        // "<" is escaped so the data can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 pb-8 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.18em] text-smoke">
          <Link href="/" className="transition hover:text-wine-600">Home</Link>
          <span className="mx-2 text-wine-200" aria-hidden="true">/</span>
          <span className="text-ink/80">{full}</span>
        </nav>

        <header className="rise mt-8 grid gap-8 md:grid-cols-[16rem_1fr] md:items-center">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[16rem] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(28,21,24,0.04)] md:mx-0">
            <Photo url={perfume.image_url} alt={full} seed={perfume.brand + perfume.name} sizes="256px" priority />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-wine-600">{perfume.brand}</p>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight text-ink sm:text-6xl">{perfume.name}</h1>
            <div className="wine-rule my-6 w-32" />
            <p className="max-w-xl leading-relaxed text-smoke">
              {perfume.name} by {perfume.brand} is a fragrance for {audience}.{' '}
              {entries.length > 0
                ? `Below ${entries.length === 1 ? 'is' : 'are'} ${entries.length} fragrance${entries.length === 1 ? '' : 's'} inspired by it, so you can find a similar scent that suits your budget.`
                : 'We are still curating fragrances inspired by it. Check back soon.'}{' '}
              Prices are approximate and change, so check the store before you buy.
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {usd(perfume.price_usd) && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-smoke">Original from</dt>
                  <dd className="text-ink">{usd(perfume.price_usd)}{ils(perfume.price_ils) && <span className="ml-2 text-smoke">{ils(perfume.price_ils)}</span>}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] uppercase tracking-[0.2em] text-smoke">Audience</dt>
                <dd className="text-ink">{audienceLabel(perfume.gender)}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="mt-14" aria-labelledby="inspired-heading">
          <h2 id="inspired-heading" className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-wine-600">
            Fragrances inspired by {perfume.name}
          </h2>
          {entries.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white py-12 text-center text-smoke">
              We are still curating similar scents for this fragrance.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {entries.map(e => <EntryCard key={e.id} entry={e} />)}
            </div>
          )}
        </section>

        {sameBrand.length > 0 && (
          <section className="mt-14" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-wine-600">
              More from {perfume.brand}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sameBrand.map(p => <PerfumeLink key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="mt-14" aria-labelledby="more-heading">
            <h2 id="more-heading" className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-wine-600">
              Keep exploring
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {more.map(p => <PerfumeLink key={p.id} p={p} />)}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
