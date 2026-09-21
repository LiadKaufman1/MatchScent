// Elegant bottle illustration shown until we have a real photo of the fragrance.
// Every perfume gets its own bottle shape and liquid colour (chosen from its name),
// so the grid does not look repetitive. It is an illustration, not a photo.
const BACKGROUNDS = ['art-a', 'art-b', 'art-c'] as const;

const LIQUIDS = [
  '#7E1F37', // burgundy
  '#4B2A5B', // plum
  '#B45B6B', // rose
  '#B9803B', // amber
  '#9B2A45', // garnet
] as const;

const hash = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
};

const STROKE = '#1C1518';

function Bottle({ shape, liquid }: { shape: number; liquid: string }) {
  const common = { stroke: STROKE, strokeWidth: 1.3, strokeLinejoin: 'round' as const };
  if (shape === 0) {
    // classic flacon
    return (
      <>
        <rect x="46" y="14" width="28" height="24" rx="3" fill="#1C1518" />
        <rect x="52" y="38" width="16" height="12" fill="#3a2e33" />
        <rect x="34" y="50" width="52" height="86" rx="11" fill="#ffffff" fillOpacity=".7" {...common} />
        <rect x="38" y="76" width="44" height="56" rx="8" fill={liquid} fillOpacity=".88" />
        <rect x="45" y="88" width="30" height="24" rx="2" fill="#ffffff" fillOpacity=".92" stroke={STROKE} strokeWidth=".6" />
        <line x1="50" y1="96" x2="70" y2="96" stroke={STROKE} strokeWidth=".8" opacity=".6" />
        <line x1="53" y1="102" x2="67" y2="102" stroke={STROKE} strokeWidth=".8" opacity=".35" />
      </>
    );
  }
  if (shape === 1) {
    // tall cylinder
    return (
      <>
        <rect x="50" y="10" width="20" height="30" rx="3" fill="#1C1518" />
        <rect x="55" y="40" width="10" height="8" fill="#3a2e33" />
        <rect x="40" y="48" width="40" height="92" rx="9" fill="#ffffff" fillOpacity=".7" {...common} />
        <rect x="43" y="70" width="34" height="66" rx="6" fill={liquid} fillOpacity=".88" />
        <rect x="47" y="90" width="26" height="22" rx="2" fill="#ffffff" fillOpacity=".92" stroke={STROKE} strokeWidth=".6" />
        <line x1="51" y1="98" x2="69" y2="98" stroke={STROKE} strokeWidth=".8" opacity=".6" />
      </>
    );
  }
  // round bottle
  return (
    <>
      <rect x="48" y="14" width="24" height="26" rx="12" fill="#1C1518" />
      <rect x="54" y="40" width="12" height="12" fill="#3a2e33" />
      <circle cx="60" cy="96" r="40" fill="#ffffff" fillOpacity=".7" {...common} />
      <path d="M22 100a40 40 0 0 0 76 0c-6 10-20 16-38 16s-32-6-38-16Z" fill={liquid} fillOpacity=".88" />
      <circle cx="60" cy="90" r="14" fill="#ffffff" fillOpacity=".92" stroke={STROKE} strokeWidth=".6" />
      <line x1="53" y1="90" x2="67" y2="90" stroke={STROKE} strokeWidth=".8" opacity=".55" />
    </>
  );
}

export default function PerfumeArt({ seed, className = '' }: { seed: string; className?: string }) {
  const h = hash(seed);
  return (
    <div className={`${BACKGROUNDS[h % 3]} relative flex h-full w-full items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 156" className="h-[66%] w-auto drop-shadow-[0_14px_14px_rgba(28,21,24,0.14)]" fill="none">
        <Bottle shape={(h >> 3) % 3} liquid={LIQUIDS[(h >> 5) % LIQUIDS.length]} />
      </svg>
    </div>
  );
}
