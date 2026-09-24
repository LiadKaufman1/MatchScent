import type { Metadata } from 'next';
import Link from 'next/link';
import { getOverview, type RankedPerfume } from '@/lib/load-home';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import PerfumeCard from '@/app/components/PerfumeCard';
import SuggestForm from '@/app/components/SuggestForm';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

const heading = 'mb-4 section-title';

export function topMetadata(lang: Lang): Metadata {
  const t = getDict(lang).top;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: withLang(lang, '/top'), languages: { he: '/top', en: '/en/top', 'x-default': '/top' } },
  };
}

// Community charts (like Parfumo's "Top" pages): built only from our members' own votes.
export async function TopView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const top = t.top;
  const o = await getOverview();

  const chart = (id: string, title: string, items: RankedPerfume[], line: (x: RankedPerfume) => string) => (
    <section aria-labelledby={id}>
      <h2 id={id} className={heading}>{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-5 text-sm text-smoke">{top.empty}</p>
      ) : (
        <ol className="grid gap-2">
          {items.map((x, i) => (
            <li key={x.perfume.id} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-center text-sm font-extrabold text-wine-600" dir="ltr">{i + 1}</span>
              <div className="min-w-0 flex-1"><PerfumeCard perfume={x.perfume} lang={lang} note={line(x)} /></div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/top" />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{top.heading}</h1>
        <div className="wine-rule my-6 w-32" />
        <p className="mb-10 max-w-xl text-smoke">{top.intro}</p>

        <div className="grid gap-12 md:grid-cols-2">
          {chart('chart-top', top.topRated, o.topRated, x => fmt(top.ratingLine, { avg: (x.avg ?? 0).toFixed(1), count: x.n }))}
          {chart('chart-loved', top.mostLoved, o.mostLoved, x => fmt(top.lovesLine, { n: x.n }))}
          {chart('chart-wanted', top.mostWanted, o.mostWanted, x => fmt(top.wantLine, { n: x.n }))}
          {chart('chart-owned', top.mostOwned, o.mostOwned, x => fmt(top.ownLine, { n: x.n }))}
          {chart('chart-reviewed', top.mostReviewed, o.mostReviewed, x => fmt(top.reviewsLine, { n: x.n }))}

          <section aria-labelledby="chart-members">
            <h2 id="chart-members" className={heading}>{top.topMembers}</h2>
            {o.topMembers.length === 0 ? (
              <p className="rounded-2xl border border-line bg-white p-5 text-sm text-smoke">{top.empty}</p>
            ) : (
              <ol className="grid gap-2">
                {o.topMembers.map((m, i) => (
                  <li key={m.user_id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                    <span className="w-6 shrink-0 text-center text-sm font-extrabold text-wine-600" dir="ltr">{i + 1}</span>
                    <Link href={withLang(lang, `/u/${m.user_id}`)} prefetch={false} className="min-w-0 flex-1 truncate font-bold text-ink hover:text-wine-600">{m.name}</Link>
                    <span className="shrink-0 text-xs text-smoke">{fmt(top.memberLine, { ratings: m.ratings, reviews: m.reviews })}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

export function suggestMetadata(lang: Lang): Metadata {
  const s = getDict(lang).suggest;
  return { title: s.perfumeTitle, description: s.perfumeMeta, robots: { index: false, follow: true } };
}

// "Suggest a perfume": the community grows the catalog; the owner approves every suggestion.
export function SuggestView({ lang }: { lang: Lang }) {
  const s = getDict(lang).suggest;
  return (
    <div className="site">
      <SiteHeader lang={lang} path="/suggest" />
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink">{s.perfumeTitle}</h1>
        <div className="wine-rule my-6 w-32" />
        <p className="mb-6 text-smoke">{s.perfumeIntro}</p>
        <SuggestForm lang={lang} kind="perfume" />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
