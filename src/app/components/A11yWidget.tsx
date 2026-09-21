'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Accessibility, Contrast, Minus, Plus, RotateCcw, Type, Underline, X, CirclePause } from 'lucide-react';
import { getDict, withLang, type Lang } from '@/lib/i18n';
import { MAX_SIZE, resetA11y, setA11y, useA11y } from '@/lib/a11y-store';

function Toggle({
  pressed,
  onClick,
  icon,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-500 ${
        pressed
          ? 'border-wine-600 bg-wine-600 text-white'
          : 'border-line bg-white text-ink hover:border-wine-600/60'
      }`}
    >
      <span aria-hidden="true" className="shrink-0">{icon}</span>
      {label}
    </button>
  );
}

// The floating accessibility button in the corner of every page.
export default function A11yWidget({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const a = useA11y();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="fixed bottom-4 start-4 z-50">
      {open && (
        <div
          id="a11y-panel"
          role="dialog"
          aria-label={t.a11yTitle}
          className="mb-3 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-4 text-ink shadow-[0_24px_48px_-16px_rgba(28,21,24,0.35)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">{t.a11yTitle}</p>
            <button
              type="button"
              onClick={() => { setOpen(false); buttonRef.current?.focus(); }}
              aria-label={t.a11yClose}
              className="rounded-full p-1.5 text-smoke transition hover:text-wine-600 focus-visible:outline-2 focus-visible:outline-wine-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setA11y({ size: a.size + 1 })}
              disabled={a.size >= MAX_SIZE}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium transition hover:border-wine-600/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-500 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.a11yBigger}
            </button>
            <button
              type="button"
              onClick={() => setA11y({ size: a.size - 1 })}
              disabled={a.size <= 0}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium transition hover:border-wine-600/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-500 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
              {t.a11ySmaller}
            </button>
          </div>

          <div className="mt-2 space-y-2">
            <Toggle pressed={!!a.contrast} onClick={() => setA11y({ contrast: a.contrast ? 0 : 1 })} icon={<Contrast className="h-4 w-4" />} label={t.a11yContrast} />
            <Toggle pressed={!!a.links} onClick={() => setA11y({ links: a.links ? 0 : 1 })} icon={<Underline className="h-4 w-4" />} label={t.a11yLinks} />
            <Toggle pressed={!!a.readable} onClick={() => setA11y({ readable: a.readable ? 0 : 1 })} icon={<Type className="h-4 w-4" />} label={t.a11yReadable} />
            <Toggle pressed={!!a.still} onClick={() => setA11y({ still: a.still ? 0 : 1 })} icon={<CirclePause className="h-4 w-4" />} label={t.a11yStill} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs">
            <button
              type="button"
              onClick={resetA11y}
              className="inline-flex items-center gap-1.5 font-medium text-smoke transition hover:text-wine-600 focus-visible:outline-2 focus-visible:outline-wine-500"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.a11yReset}
            </button>
            <Link href={withLang(lang, '/accessibility')} className="font-medium text-wine-700 underline underline-offset-4">
              {t.a11yStatement}
            </Link>
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label={t.a11yButton}
        title={t.a11yButton}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-wine-600 text-white shadow-[0_12px_24px_-8px_rgba(126,31,55,0.6)] transition hover:bg-wine-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-500"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}
