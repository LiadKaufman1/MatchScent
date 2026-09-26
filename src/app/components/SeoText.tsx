import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getDict, withLang, type Lang } from '@/lib/i18n';

// The text at the bottom of the home page: how to find an expensive scent at a fair price, and the frequently asked
// questions (closed until clicked; native <details>, so it works without scripts and with a keyboard). The questions
// are also given to search engines as FAQ data.
export default function SeoText({ lang }: { lang: Lang }) {
  const s = getDict(lang).seo;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: s.faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
  };

  return (
    <section className="mx-auto mt-20 w-full max-w-4xl px-4 sm:px-6" aria-labelledby="seo-heading">
      <script
        type="application/ld+json"
        // "<" is escaped so the data can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="rounded-3xl border border-line bg-white px-5 py-8 shadow-[0_18px_40px_-32px_rgba(28,21,24,0.35)] sm:px-10 sm:py-12">
        <h2 id="seo-heading" className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{s.heading}</h2>
        <div className="wine-rule my-6 w-24" />
        <div className="space-y-4 text-base leading-relaxed text-smoke sm:text-lg sm:leading-relaxed">
          {s.paragraphs.map(p => <p key={p.slice(0, 40)}>{p}</p>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={withLang(lang, '/inspired')} className="rounded-full bg-wine-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-wine-700">{s.ctaInspired}</Link>
          <Link href={withLang(lang, '/perfumes')} className="rounded-full border border-wine-600/50 bg-white px-6 py-3 text-sm font-bold text-wine-700 transition hover:bg-blush">{s.ctaAll}</Link>
        </div>

        <h3 className="mb-4 mt-12 text-2xl font-extrabold text-ink">{s.faqHeading}</h3>
        <div className="space-y-3">
          {s.faq.map(item => (
            <details key={item.q} className="group rounded-2xl border border-line bg-[#FCFAF9] transition open:border-wine-600/40 open:bg-white open:shadow-[0_10px_30px_-24px_rgba(126,31,55,0.55)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-start font-bold text-ink marker:content-none hover:text-wine-700 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-wine-600 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-smoke">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
