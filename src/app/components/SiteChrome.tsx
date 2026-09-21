import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-gold-500/15">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-serif text-xl gold-text">MatchScent</Link>
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-mist transition hover:text-gold-300">
          All fragrances
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-gold-500/15 px-6 py-10 text-center">
      <p className="font-serif text-lg gold-text">MatchScent</p>
      <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-mist/80">
        MatchScent is an independent fragrance guide. We are not affiliated with, or endorsed by, any of the brands
        mentioned. All trademarks belong to their respective owners.
      </p>
    </footer>
  );
}
