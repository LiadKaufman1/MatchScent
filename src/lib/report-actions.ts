'use server';

import { headers } from 'next/headers';
import { getSupabaseAdmin } from './supabase-admin';
import { tooManyRequests } from './rate-limit';

// "Report a problem": what a visitor writes goes into the locked table site_reports (db-migrations/2026-09-v7-site-reports.sql)
// through the server's private key. Server actions are public endpoints, so everything is checked here.

export type ReportResult = { ok: true } | { ok: false; error: 'too_short' | 'too_many' | 'failed' };

const clean = (value: FormDataEntryValue | null, max: number) =>
  String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);

export async function sendReport(formData: FormData): Promise<ReportResult> {
  // A field real visitors never see: robots fill it in. They get a fake "thank you" and nothing is saved.
  if (clean(formData.get('website'), 200)) return { ok: true };

  const message = clean(formData.get('message'), 2000);
  if (message.length < 5) return { ok: false, error: 'too_short' };

  if (tooManyRequests({ headers: await headers() }, 'report', 5, 10 * 60_000)) return { ok: false, error: 'too_many' };

  // Only a path on this site is kept as "the page the visitor came from".
  const rawPage = clean(formData.get('page'), 300);
  const page = rawPage.startsWith('/') && !rawPage.startsWith('//') ? rawPage : null;
  const contact = clean(formData.get('contact'), 200) || null;
  const lang = clean(formData.get('lang'), 2) === 'en' ? 'en' : 'he';

  try {
    const { error } = await getSupabaseAdmin().from('site_reports').insert({ message, page, contact, lang });
    if (error) return { ok: false, error: 'failed' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'failed' };
  }
}
