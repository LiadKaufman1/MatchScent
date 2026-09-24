'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { submitSuggestion } from '@/lib/community-actions';
import { useViewer } from '@/lib/use-viewer';
import { getDict, withLang, type Lang } from '@/lib/i18n';

// "Suggest a similar scent" (on a perfume page) or "suggest a perfume" (its own page).
// Suggestions wait for the owner's approval in /admin/community before anything changes on the site.
export default function SuggestForm({ lang, kind, perfumeId, compact = false }: {
  lang: Lang;
  kind: 'similar' | 'perfume';
  perfumeId?: string;
  compact?: boolean;
}) {
  const t = getDict(lang);
  const s = t.suggest;
  const { ready, userId } = useViewer();
  const [open, setOpen] = useState(!compact);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unisex' | ''>('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitSuggestion({ kind, perfumeId, brand, name, gender: gender || null, note });
      if (result.success) {
        setMessage(s.sent);
        setBrand(''); setName(''); setNote(''); setGender('');
        return;
      }
      setMessage(
        result.error === 'same brand' ? s.sameBrand
          : result.error === 'too many' ? s.tooMany
            : result.error === 'blocked word' ? t.community.blockedWord
              : t.auth.errorGeneric,
      );
    });
  };

  const field = 'w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-wine-600';
  const label = 'mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-smoke';

  return (
    <div className="rounded-2xl border border-dashed border-wine-600/40 bg-white p-5">
      {kind === 'similar' && (
        <>
          <p className="flex items-center gap-2 font-bold text-ink">
            <Lightbulb className="h-4 w-4 text-wine-600" aria-hidden="true" />
            {s.similarHeading}
          </p>
          <p className="mt-1 text-sm text-smoke">{s.similarText}</p>
        </>
      )}

      {ready && !userId && (
        <p className="mt-3 text-sm">
          <Link href={withLang(lang, '/login')} className="font-bold text-wine-600 underline underline-offset-4">{s.login}</Link>
        </p>
      )}

      {userId && !open && (
        <button type="button" onClick={() => setOpen(true)} className="mt-3 rounded-full border border-wine-600/50 px-4 py-1.5 text-sm font-bold text-wine-600 transition hover:bg-blush">
          {s.similarCta}
        </button>
      )}

      {userId && open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={label}>{s.brand}</span>
            <input required maxLength={80} value={brand} onChange={e => setBrand(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>{s.name}</span>
            <input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className={field} />
          </label>
          {kind === 'perfume' && (
            <label className="block">
              <span className={label}>{s.gender}</span>
              <select value={gender} onChange={e => setGender(e.target.value as typeof gender)} className={field}>
                <option value="">-</option>
                <option value="female">{t.audFemale}</option>
                <option value="male">{t.audMale}</option>
                <option value="unisex">{t.audUnisex}</option>
              </select>
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className={label}>{s.note}</span>
            <textarea maxLength={500} rows={2} value={note} onChange={e => setNote(e.target.value)} className={field} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending || !brand.trim() || !name.trim()} className="rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-50">
              {s.submit}
            </button>
          </div>
        </form>
      )}
      {message && <p className="mt-3 text-sm font-medium text-wine-700" role="status">{message}</p>}
    </div>
  );
}
