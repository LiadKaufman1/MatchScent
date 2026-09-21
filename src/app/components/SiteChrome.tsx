import Link from 'next/link';
import CountrySelect from './CountrySelect';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display ${className}`}>
      Match<span className="text-wine-600">Scent</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" aria-label="MatchScent home">
          <Wordmark className="text-3xl font-bold" />
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="hidden text-xs font-medium uppercase tracking-[0.2em] text-smoke transition hover:text-wine-600 sm:inline">
            All fragrances
          </Link>
          <CountrySelect />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-plum-900 px-6 py-12 text-center">
      <p className="font-display text-3xl font-bold text-white">
        Match<span className="text-wine-200">Scent</span>
      </p>
      <div className="mx-auto my-5 h-px w-16 bg-wine-200/40" />
      <p className="mx-auto max-w-2xl text-xs leading-relaxed text-white/60">
        MatchScent is an independent fragrance guide. We are not affiliated with, or endorsed by, any of the brands
        mentioned. All trademarks belong to their respective owners.
      </p>
    </footer>
  );
}
