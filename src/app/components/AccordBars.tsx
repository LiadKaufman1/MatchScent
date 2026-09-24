import { accordLabel } from '@/lib/notes';
import { scentColor } from '@/lib/scent-colors';
import type { Lang } from '@/lib/i18n';

// The main accords as coloured bars, strongest first (the list comes in that order, so each
// next bar is a little shorter). Colours are our own scent-family palette.
export default function AccordBars({ accords, lang, title }: { accords: string[]; lang: Lang; title: string }) {
  const shown = accords.slice(0, 7);
  if (shown.length === 0) return null;
  return (
    <div className="mt-6 max-w-md">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-smoke">{title}</p>
      <ul className="space-y-1.5">
        {shown.map((a, i) => (
          <li key={a}>
            <span
              className="block truncate rounded-md px-3 py-1 text-sm font-bold text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]"
              style={{ width: `${100 - i * 9}%`, backgroundColor: scentColor(a) }}
            >
              {accordLabel(a, lang)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
