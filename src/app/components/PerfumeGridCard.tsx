import { ArrowUpRight } from 'lucide-react';
import type { ShownPerfume } from '@/lib/load-catalog';
import { fmt, getDict, withLang, type Lang } from '@/lib/i18n';
import Photo from './Photo';
import HoverLink from './HoverLink';

// The big perfume tile (picture first, then brand and name) used on the home page and on "All fragrances".
export default function PerfumeGridCard({ p, lang, index = 99 }: { p: ShownPerfume; lang: Lang; index?: number }) {
  const t = getDict(lang);
  const badge = p.entryCount > 0 ? fmt(t.similarBadge, { n: p.entryCount }) : p.inspiredOf.length > 0 ? t.allPerfumes.badgeInspired : null;
  return (
    <HoverLink
      href={withLang(lang, `/perfume/${p.slug}`)}
      className={`site-card group flex flex-col overflow-hidden rounded-2xl text-start ${index < 12 ? 'rise' : ''}`}
      style={index < 12 ? { animationDelay: `${index * 45}ms` } : undefined}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Photo url={p.image_url} alt={`${p.brand} ${p.name}`} seed={p.brand + p.name} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
        {badge && (
          <span
            className={`absolute start-2.5 top-2.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur sm:start-3 sm:top-3 ${
              p.entryCount > 0 ? 'border-wine-600/25 bg-white/90 text-wine-700' : 'border-line bg-white/80 text-smoke'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{p.brand}</span>
        <h3 className="mt-1.5 text-lg font-bold leading-tight text-ink sm:text-xl">{p.name}</h3>
        <div className="mt-auto flex items-end justify-end pt-4 text-sm">
          <ArrowUpRight className="h-4 w-4 shrink-0 text-wine-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
    </HoverLink>
  );
}
