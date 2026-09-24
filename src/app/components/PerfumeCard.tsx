import Link from 'next/link';
import type { ShownPerfume } from '@/lib/load-catalog';
import { withLang, type Lang } from '@/lib/i18n';
import Photo from './Photo';

// A small perfume tile for browse pages: picture, brand, name.
export default function PerfumeCard({ perfume, lang, note }: { perfume: ShownPerfume; lang: Lang; note?: string }) {
  return (
    <Link
      href={withLang(lang, `/perfume/${perfume.slug}`)}
      prefetch={false}
      className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition hover:border-wine-600/50"
    >
      <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
        <Photo url={perfume.image_url} alt={`${perfume.brand} ${perfume.name}`} seed={perfume.brand + perfume.name} sizes="64px" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-wine-600">{perfume.brand}</span>
        <span className="block truncate text-base font-bold text-ink">{perfume.name}</span>
        {note && <span className="block text-xs text-smoke">{note}</span>}
      </span>
    </Link>
  );
}
