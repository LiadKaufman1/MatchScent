'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser } from '@/lib/auth-actions';
import { getDict, withLang, type Lang } from '@/lib/i18n';

export default function AuthForm({ lang, mode }: { lang: Lang; mode: 'login' | 'register' }) {
  const t = getDict(lang);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = mode === 'login'
        ? await loginUser(email, password)
        : await registerUser(email, password, displayName);

      if (!result.success) {
        setError(t.auth.errorGeneric);
        return;
      }
      // Registering without email confirmation (the current setup) logs the visitor in
      // immediately, exactly like a login - only show "check your email" when it's actually needed.
      if (mode === 'register' && result.needsConfirmation) {
        setDone(true);
        return;
      }
      router.push(withLang(lang, '/'));
      router.refresh();
    });
  };

  if (done) {
    return <p className="mx-auto max-w-sm rounded-2xl border border-line bg-white p-6 text-center text-ink">{t.auth.registerSuccess}</p>;
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(28,21,24,0.04)]">
      {mode === 'register' && (
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.auth.displayNameLabel}</span>
          <input
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-wine-600"
          />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.auth.emailLabel}</span>
        <input
          required
          type="email"
          dir="ltr"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line px-3.5 py-2.5 text-end outline-none focus:border-wine-600"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-smoke">{t.auth.passwordLabel}</span>
        <input
          required
          type="password"
          dir="ltr"
          minLength={mode === 'register' ? 8 : undefined}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line px-3.5 py-2.5 text-end outline-none focus:border-wine-600"
        />
        {mode === 'register' && <span className="mt-1 block text-xs text-smoke">{t.auth.passwordHint}</span>}
      </label>
      {error && <p className="text-sm font-medium text-wine-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-wine-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-wine-700 disabled:opacity-60"
      >
        {pending ? t.auth.submitting : mode === 'login' ? t.auth.loginSubmit : t.auth.registerSubmit}
      </button>
      <p className="text-center text-sm">
        <a href={withLang(lang, mode === 'login' ? '/register' : '/login')} className="font-bold text-wine-600 underline underline-offset-4">
          {mode === 'login' ? t.auth.noAccountYet : t.auth.haveAccountAlready}
        </a>
      </p>
    </form>
  );
}
