// Elegant placeholder shown until we have a real photo of the fragrance.
const VARIANTS = ['art-a', 'art-b', 'art-c'] as const;

const pick = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return VARIANTS[h % VARIANTS.length];
};

export default function PerfumeArt({ seed, className = '' }: { seed: string; className?: string }) {
  return (
    <div className={`${pick(seed)} relative flex h-full w-full items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 150" className="h-[62%] w-auto text-gold-500/80" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <rect x="46" y="14" width="28" height="24" rx="3" />
        <line x1="52" y1="22" x2="68" y2="22" opacity=".5" />
        <rect x="52" y="38" width="16" height="12" />
        <path d="M34 62c0-7 6-12 13-12h26c7 0 13 5 13 12v58c0 8-6 14-14 14H48c-8 0-14-6-14-14V62Z" />
        <rect x="44" y="76" width="32" height="30" rx="2" opacity=".55" />
        <path d="M38 116h44" opacity=".35" />
        <path d="M60 84l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" opacity=".7" strokeWidth="1" />
      </svg>
    </div>
  );
}
