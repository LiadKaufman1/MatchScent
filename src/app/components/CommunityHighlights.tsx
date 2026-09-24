import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Lightbulb } from 'lucide-react';
import { getOverview, type RankedPerfume } from '@/lib/load-home';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import PerfumeCard from './PerfumeCard';

const heading = 'mb-4 text-sm font-bold uppercase tracking-[0.14em] text-wine-600';

// The home page's community band: latest reviews, top rated, most wanted, new members' photos,
// and "missing a perfume? suggest it". Sections without data are simply left out.
export default async function CommunityHighlights({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const h = t.homeCommunity;
  const o = await getOverview();

  const ranked = (title: string, items: RankedPerfume[], line: (x: RankedPerfume) => string) =>
    items.length > 0 && (
      <section>
        <h2 className={heading}>{title}</h2>
        <div className="grid gap-3">
          {items.slice(0, 5).map(x => <PerfumeCard key={x.perfume.id} perfume={x.perfume} lang={lang} note={line(x)} />)}
        </div>
      </section>
    );

  return (
    <div className="mx-auto mb-14 max-w-7xl px-4 sm:px-6">
      {o.latestReviews.length > 0 && (
        <section className="mb-12" aria-labelledby="latest-reviews">
          <h2 id="latest-reviews" className={heading}>{h.latestReviews}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {o.latestReviews.slice(0, 6).map(r => (
              <article key={r.id} className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <p className="text-sm">
                  <Link href={withLang(lang, `/u/${r.user_id}`)} prefetch={false} className="font-bold text-ink hover:text-wine-600">{r.author}</Link>{' '}
                  <span className="text-smoke">
                    {fmt(h.reviewOf, { name: '' })}
                    <Link href={withLang(lang, `/perfume/${r.perfume.slug}`)} prefetch={false} className="font-bold text-wine-600 hover:text-wine-700">
                      {r.perfume.brand} {r.perfume.name}
                    </Link>
                  </span>
                </p>
                <p className="mt-2 line-clamp-4 leading-relaxed text-smoke">{r.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {(o.topRated.length > 0 || o.mostWanted.length > 0) && (
        <div className="mb-12 grid gap-10 md:grid-cols-2">
          {ranked(h.topRated, o.topRated, x => fmt(t.top.ratingLine, { avg: (x.avg ?? 0).toFixed(1), count: x.n }))}
          {ranked(h.mostWanted, o.mostWanted, x => fmt(t.top.wantLine, { n: x.n }))}
        </div>
      )}

      {o.latestPhotos.length > 0 && (
        <section className="mb-12" aria-labelledby="latest-photos">
          <h2 id="latest-photos" className={heading}>{h.newPhotos}</h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {o.latestPhotos.slice(0, 6).map(ph => (
              <li key={ph.id}>
                <Link href={withLang(lang, `/perfume/${ph.perfume.slug}`)} prefetch={false} className="relative block aspect-square overflow-hidden rounded-2xl border border-line">
                  <Image src={ph.url} alt={`${ph.perfume.brand} ${ph.perfume.name}`} fill sizes="(min-width: 640px) 180px, 30vw" className="object-cover" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-wine-600/40 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 font-bold text-ink">
            <Lightbulb className="h-4 w-4 text-wine-600" aria-hidden="true" />
            {h.missingHeading}
          </p>
          <p className="mt-1 text-sm text-smoke">{h.missingText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={withLang(lang, '/suggest')} className="rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700">{t.nav.suggest}</Link>
          <Link href={withLang(lang, '/top')} className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-bold text-wine-600 transition hover:border-wine-600/60">
            {h.seeCharts}
            <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
