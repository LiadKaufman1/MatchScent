'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { sendReport } from '@/lib/report-actions';
import { getDict, withLang, type Lang } from '@/lib/i18n';

// The "Report a problem" form. The page the visitor came from arrives as ?page=/perfume/... (see ReportLink).
export default function ReportForm({ lang, email }: { lang: Lang; email?: string }) {
  const r = getDict(lang).report;
  const raw = useSearchParams().get('page') ?? '';
  const page = raw.startsWith('/') && !raw.startsWith('//') ? raw.slice(0, 300) : '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await sendReport(data);
      if (result.ok) return setDone(true);
      setError(result.error === 'too_short' ? r.tooShort : result.error === 'too_many' ? r.tooMany : r.failed);
    });
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6" role="status">
        <p className="text-xl font-extrabold text-ink">{r.doneTitle}</p>
        <p className="mt-2 text-smoke">{r.done}</p>
        <Link href={page || withLang(lang, '/')} className="mt-5 inline-block rounded-full bg-wine-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-wine-700">{r.back}</Link>
      </div>
    );
  }

  const field = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 outline-none focus:border-wine-600';
  const label = 'mb-1 block text-sm font-bold text-ink';

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <input type="hidden" name="page" value={page} />
      <input type="hidden" name="lang" value={lang} />
      {/* Real visitors never see this field; robots fill it in and are ignored. */}
      <div className="sr-only" aria-hidden="true">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {page && (
        <p className="text-sm text-smoke">
          {r.pageLabel}: <span className="font-medium text-ink" dir="ltr">{page}</span>
        </p>
      )}

      <label className="block">
        <span className={label}>{r.messageLabel}</span>
        <textarea name="message" required minLength={5} maxLength={2000} rows={5} placeholder={r.messagePlaceholder} className={field} />
      </label>

      <label className="block">
        <span className={label}>{r.contactLabel}</span>
        <input name="contact" maxLength={200} placeholder={r.contactPlaceholder} autoComplete="email" className={field} />
      </label>

      <p className="text-xs text-smoke">{r.privacy}</p>

      {error && (
        <p className="rounded-xl bg-blush px-4 py-3 text-sm font-medium text-wine-700" role="alert">
          {error}
          {email && <> <a href={`mailto:${email}`} className="font-bold underline underline-offset-4" dir="ltr">{email}</a></>}
        </p>
      )}

      <button type="submit" disabled={pending} className="rounded-full bg-wine-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-60">
        {pending ? r.sending : r.submit}
      </button>
    </form>
  );
}
