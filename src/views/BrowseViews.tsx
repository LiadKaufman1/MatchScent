import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrandPage, getBrandSlugs, getNotePage, getNoteSlugs, type InspiredHit } from '@/lib/load-browse';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import { noteLabel } from '@/lib/notes';
import { scentColor } from '@/lib/scent-colors';
import Photo from '@/app/components/Photo';
import PerfumeCard from '@/app/components/PerfumeCard';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

export const brandStaticParams = async () => (await getBrandSlugs()).map(slug => ({ slug }));
// Notes that only one or two fragrances have would be thin pages: they are built when first visited, not ahead of time.
export const noteStaticParams = async () => (await getNoteSlugs(3)).map(slug => ({ slug }));

export async function brandMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const t = getDict(lang);
  const data = await getBrandPage(slug);
  if (!data) return { title: t.notFoundTitle, robots: { index: false } };
  const path = `/brand/${slug}`;
  return {
    title: fmt(t.browse.brandMeta, { brand: data.brand }),
    alternates: { canonical: withLang(lang, path), languages: { en: withLang('en', path), he: withLang('he', path), 'x-default': path } },
  };
}

export async function noteMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const t = getDict(lang);
  const data = await getNotePage(slug);
  if (!data) return { title: t.notFoundTitle, robots: { index: false } };
  const path = `/notes/${slug}`;
  return {
    title: fmt(t.browse.noteMeta, { note: noteLabel(data.name, lang) }),
    alternates: { canonical: withLang(lang, path), languages: { en: withLang('en', path), he: withLang('he', path), 'x-default': path } },
    // A note with only a couple of fragrances is not worth a search-result slot yet.
    robots: data.perfumes.length + data.inspired.length >= 3 ? undefined : { index: false, follow: true },
  };
}

function InspiredList({ items, lang }: { items: InspiredHit[]; lang: Lang }) {
  const t = getDict(lang);
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(({ entry, originals }) => (
        <li key={entry.id} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
          <span className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-line bg-white">
            <Photo url={entry.image_url} alt={`${entry.brand} ${entry.name}`} seed={entry.brand + entry.name} sizes="72px" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{entry.brand}</span>
            <span className="block text-base font-bold text-ink">{entry.name}</span>
            <span className="mt-1 block text-xs text-smoke">
              {t.browse.inspiredBy}{' '}
              {originals.map((o, i) => (
                <span key={o.id}>
                  {i > 0 && ', '}
                  <Link href={withLang(lang, `/perfume/${o.slug}`)} prefetch={false} className="font-medium text-ink underline-offset-2 hover:text-wine-600 hover:underline">
                    {o.brand} {o.name}
                  </Link>
                </span>
              ))}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export async function BrandView({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const data = await getBrandPage(slug);
  if (!data) notFound();

  return (
    <div className="site">
      <SiteHeader lang={lang} path={`/brand/${slug}`} />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{fmt(t.browse.brandHeading, { brand: data.brand })}</h1>
        <p className="mt-3 text-smoke">{fmt(t.browse.brandCounts, { perfumes: data.perfumes.length, inspired: data.inspired.length })}</p>
        <div className="wine-rule my-6 w-32" />

        {data.perfumes.length > 0 && (
          <section aria-labelledby="brand-perfumes">
            <h2 id="brand-perfumes" className="mb-4 section-title">{fmt(t.browse.brandPerfumes, { brand: data.brand })}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.perfumes.map(p => <PerfumeCard key={p.id} perfume={p} lang={lang} />)}
            </div>
          </section>
        )}

        {data.inspired.length > 0 && (
          <section className="mt-12" aria-labelledby="brand-inspired">
            <h2 id="brand-inspired" className="mb-4 section-title">{fmt(t.browse.brandInspired, { brand: data.brand })}</h2>
            <InspiredList items={data.inspired} lang={lang} />
          </section>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

export async function NoteView({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const data = await getNotePage(slug);
  if (!data) notFound();
  const note = noteLabel(data.name, lang);

  return (
    <div className="site">
      <SiteHeader lang={lang} path={`/notes/${slug}`} />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="flex items-center gap-3 text-4xl font-extrabold text-ink sm:text-5xl">
          <span aria-hidden="true" className="inline-block h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: scentColor(data.name) }} />
          {fmt(t.browse.noteHeading, { note })}
        </h1>
        {lang === 'he' && note !== data.name && <p className="mt-2 text-smoke"><span dir="ltr">{data.name}</span></p>}
        <p className="mt-3 text-smoke">{fmt(t.browse.brandCounts, { perfumes: data.perfumes.length, inspired: data.inspired.length })}</p>
        <div className="wine-rule my-6 w-32" />

        {data.perfumes.length > 0 && (
          <section aria-labelledby="note-perfumes">
            <h2 id="note-perfumes" className="sr-only">{fmt(t.browse.noteHeading, { note })}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.perfumes.map(({ perfume, group }) => (
                <PerfumeCard key={perfume.id} perfume={perfume} lang={lang} note={t.notes[group]} />
              ))}
            </div>
          </section>
        )}

        {data.inspired.length > 0 && (
          <section className="mt-12" aria-labelledby="note-inspired">
            <h2 id="note-inspired" className="mb-4 section-title">{fmt(t.browse.noteInspired, { note })}</h2>
            <InspiredList items={data.inspired} lang={lang} />
          </section>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
