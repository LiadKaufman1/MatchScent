import Link from 'next/link';
import { checkAdminAuth, deleteReport, setReportHandled } from '@/lib/actions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import LoginForm from '../components/LoginForm';

export const dynamic = 'force-dynamic';

type Report = { id: number; created_at: string; message: string; page: string | null; contact: string | null; lang: string | null; handled: boolean };

// The problems visitors reported from "Report a problem": newest first, open ones first. Mark one as handled or delete it.
export default async function ReportsAdminPage() {
  if (!(await checkAdminAuth())) return <LoginForm />;

  const { data, error } = await getSupabaseAdmin()
    .from('site_reports')
    .select('id, created_at, message, page, contact, lang, handled')
    .order('handled', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200);
  const reports = (data ?? []) as Report[];
  const open = reports.filter(r => !r.handled).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back to the dashboard</Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heebo)' }}>Problem reports</h1>
        <p className="mb-8 text-sm text-slate-500">
          What visitors wrote in &quot;Report a problem&quot; ({open} open). The page they came from is shown so you can open it.
          {error ? ' The table is not there yet: run db-migrations/2026-09-v7-site-reports.sql in the Supabase SQL Editor.' : ''}
        </p>

        {reports.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No reports yet.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map(r => (
              <li key={r.id} className={`rounded-xl border bg-white p-4 ${r.handled ? 'border-slate-200 opacity-60' : 'border-slate-300'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{new Date(r.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' })}{r.lang ? ` · ${r.lang}` : ''}</span>
                  <span className="flex gap-2">
                    <form action={setReportHandled}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="handled" value={r.handled ? '0' : '1'} />
                      <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-slate-200">{r.handled ? 'Reopen' : 'Mark as handled'}</button>
                    </form>
                    <form action={deleteReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="rounded-lg bg-red-50 px-3 py-1 font-medium text-red-600 hover:bg-red-100">Delete</button>
                    </form>
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900" dir="auto">{r.message}</p>
                {(r.page || r.contact) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {r.page && <>Page: <Link href={r.page} className="font-medium text-slate-700 hover:underline" dir="ltr">{r.page}</Link></>}
                    {r.page && r.contact && ' · '}
                    {r.contact && <>Contact: <span className="font-medium text-slate-700" dir="ltr">{r.contact}</span></>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
