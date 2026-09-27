import type { Metadata } from 'next';
import Link from 'next/link';
import { X } from 'lucide-react';
import { listNoteOptions, perfumesWithAllNotes } from '@/lib/load-notes-index';
import { noteLabel } from '@/lib/notes';
import { scentColor } from '@/lib/scent-colors';
import { fmt, getDict, LANGS, withLang, type Lang } from '@/lib/i18n';
import PerfumeGridCard from '@/app/components/PerfumeGridCard';
import { SiteFooter, SiteHeader } from '@/app/components/SiteChrome';

export function allNotesMetadata(lang: Lang, filtered: boolean): Metadata {
  const t = getDict(lang).allNotes;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: withLang(lang, '/notes'),
      languages: { ...Object.fromEntries(LANGS.map(l => [l, withLang(l, '/notes')])), 'x-default': '/notes' },
    },
    // A particular combination of notes is not its own page for search engines; the plain /notes page is.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

const parseSelected = (raw: string) => [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))].slice(0, 12);
const toHref = (lang: Lang, slugs: string[]) => withLang(lang, '/notes') + (slugs.length ? `?n=${slugs.join(',')}` : '');

// "All notes": pick one or more notes (chips, no page reload needed beyond a normal link) and see every fragrance that
// has all of them. Selection lives in the URL (?n=vanilla,oud), so a combination can be bookmarked or shared.
export async function AllNotesView({ lang, raw }: { lang: Lang; raw: string }) {
  const t = getDict(lang);
  const x = t.allNotes;
  const selected = parseSelected(raw);
  const selectedSet = new Set(selected);
  const [options, hits] = await Promise.all([listNoteOptions(), perfumesWithAllNotes(selected)]);
  const nameOf = (slug: string) => options.find(o => o.slug === slug)?.name ?? slug;
  const toggleHref = (slug: string) => toHref(lang, selectedSet.has(slug) ? selected.filter(s => s !== slug) : [...selected, slug]);

  return (
    <div className="site">
      <SiteHeader lang={lang} path="/notes" />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{x.heading}</h1>
        <p className="mt-3 max-w-2xl text-smoke">{x.intro}</p>
        <div className="wine-rule my-6 w-32" />

        {selected.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-smoke">{x.selectedLabel}</span>
            {selected.map(slug => (
              <Link key={slug} href={toggleHref(slug)} className="flex items-center gap-1.5 rounded-full border border-wine-600 bg-wine-600 ps-3 pe-2 py-1 text-sm font-bold text-white transition hover:bg-wine-700">
                {noteLabel(nameOf(slug), lang)}
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ))}
            <Link href={withLang(lang, '/notes')} className="text-xs font-bold text-wine-600 underline underline-offset-4">{x.clear}</Link>
          </div>
        )}

        <ul className="flex flex-wrap gap-2" role="group" aria-label={x.pickLabel}>
          {options.map(o => {
            const on = selectedSet.has(o.slug);
            return (
              <li key={o.slug}>
                <Link
                  href={toggleHref(o.slug)}
                  aria-pressed={on}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    on ? 'border-wine-600 bg-wine-600 text-white' : 'border-line bg-white text-ink hover:border-wine-600/50'
                  }`}
                >
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/70" style={{ backgroundColor: scentColor(o.name) }} />
                  {noteLabel(o.name, lang)}
                  <span className={on ? 'opacity-80' : 'text-smoke'}>({o.count})</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          {selected.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white p-10 text-center text-smoke">{x.none}</p>
          ) : hits.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white p-10 text-center text-smoke">{x.noMatch}</p>
          ) : (
            <>
              <p className="mb-4 text-sm font-medium text-smoke" aria-live="polite">{fmt(x.count, { n: hits.length })}</p>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {hits.map((p, i) => <PerfumeGridCard key={p.id} p={p} lang={lang} index={i} />)}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
