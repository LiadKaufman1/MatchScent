'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/profile-actions';
import { useViewer } from '@/lib/use-viewer';
import { getDict, type Lang } from '@/lib/i18n';

// "Edit profile" - shown only to the member whose page this is (decided in the browser from
// the session; the server action checks the session again).
export default function ProfileEditor({ lang, profileId, name, bio }: { lang: Lang; profileId: string; name: string; bio: string }) {
  const t = getDict(lang).profile;
  const router = useRouter();
  const { userId } = useViewer();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(name);
  const [text, setText] = useState(bio);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (userId !== profileId) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-bold text-wine-600 transition hover:border-wine-600/60">
        {t.edit}
      </button>
    );
  }

  return (
    <form
      className="mt-5 max-w-md space-y-3 rounded-2xl border border-line bg-white p-5"
      onSubmit={e => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfile(displayName, text);
          if (!result.success) { setMessage(t.saveError); return; }
          setMessage(t.saved);
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.nameLabel}</span>
        <input required minLength={2} maxLength={40} value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-wine-600" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.bioLabel}</span>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={300} rows={3} placeholder={t.bioPlaceholder} className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-wine-600" />
      </label>
      {message && <p className="text-sm font-medium text-wine-700" role="status">{message}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-wine-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-60">{t.save}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-smoke transition hover:border-wine-600/60">{t.cancel}</button>
      </div>
    </form>
  );
}
