import { ArrowLeft } from 'lucide-react';
import type { InspiredItem } from '@/lib/load-directory';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from './Photo';
import HoverLink from './HoverLink';

// One card of the home page and of /inspired: the inspired fragrance and the perfume(s) it reminds people of, side by
// side in ONE picture strip - 60% of its width for the inspired fragrance, 40% for the originals (stacked when there
// are two). Under the strip: the names, each a link.
export default function InspiredPairCard({ item, lang, index }: { item: InspiredItem; lang: Lang; index: number }) {
  const t = getDict(lang);
  const e = item.entry;
  const href = e.perfumeSlug ? withLang(lang, `/perfume/${e.perfumeSlug}`) : null;
  const originals = item.originals.slice(0, 2);

  // The names below are the real links; the pictures are the same links for the pointer, so a screen reader hears them once.
  const mainPhoto = (
    // A quick zoom + brighten "punch" on click/tap, snappy in and springy back out.
    <span className="absolute inset-0 transition-transform duration-500 ease-out group-active:scale-110 group-active:duration-150 group-active:brightness-110">
      <Photo url={e.image_url} alt={`${e.brand} ${e.name}`} seed={e.brand + e.name} sizes="(min-width: 1024px) 16vw, (min-width: 768px) 20vw, 32vw" />
    </span>
  );

  return (
    <li className={`site-card flex flex-col overflow-hidden rounded-2xl ${index < 12 ? 'rise' : ''}`} style={index < 12 ? { animationDelay: `${index * 45}ms` } : undefined}>
      <div className="flex aspect-[4/3] border-b border-line">
        {href ? (
          <HoverLink href={href} tabIndex={-1} aria-hidden="true" className="group relative basis-[60%] overflow-hidden">{mainPhoto}</HoverLink>
        ) : (
          <div className="group relative basis-[60%] overflow-hidden">{mainPhoto}</div>
        )}
        <div className="flex basis-[40%] flex-col border-s border-line bg-white">
          {originals.map((o, i) => (
            <HoverLink
              key={o.id}
              href={withLang(lang, `/perfume/${o.slug}`)}
              tabIndex={-1}
              aria-hidden="true"
              className={`group relative min-h-0 flex-1 overflow-hidden [&_img]:object-contain ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <span className="absolute inset-0 transition-transform duration-500 ease-out group-active:scale-110 group-active:duration-150">
                <Photo url={o.image_url} alt={`${o.brand} ${o.name}`} seed={o.brand + o.name} sizes="(min-width: 1024px) 11vw, (min-width: 768px) 14vw, 22vw" />
              </span>
            </HoverLink>
          ))}
        </div>
      </div>

      <div className="p-3.5 pb-3 text-start sm:p-5 sm:pb-4">
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{e.brand}</span>
        <h3 className="mt-1.5 text-lg font-bold leading-tight text-ink sm:text-xl">
          {href ? <HoverLink href={href} className="hover:text-wine-700">{e.name}</HoverLink> : e.name}
        </h3>
      </div>

      <div className="mt-auto border-t border-dashed border-line bg-[#FCFAF9] p-3.5 sm:px-5">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-smoke">
          <ArrowLeft className="h-3.5 w-3.5 text-wine-600 ltr:rotate-180" aria-hidden="true" />
          {t.inspiredIndex.inspiredBy}
        </p>
        <ul className="space-y-1.5">
          {originals.map(o => (
            <li key={o.id}>
              <HoverLink href={withLang(lang, `/perfume/${o.slug}`)} className="block hover:text-wine-700">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-smoke">{o.brand}</span>
                <span className="block text-sm font-bold leading-snug text-ink">{o.name}</span>
              </HoverLink>
            </li>
          ))}
          {item.originals.length > 2 && <li className="text-xs text-smoke">+{item.originals.length - 2}</li>}
        </ul>
      </div>
    </li>
  );
}
