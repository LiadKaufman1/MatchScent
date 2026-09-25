import Link from 'next/link';
import { checkAdminAuth } from '@/lib/actions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import LoginForm from '../components/LoginForm';

export const dynamic = 'force-dynamic';

type Month = { store: string; month: string; clicks: number };
type Click = { id: number; created_at: string; store: string; perfume_key: string; country: string; price: number | null; currency: string | null; size_ml: number | null };

const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// The clicks that left the site towards a store: per store and month (what you send to a store), the perfumes people
// clicked most, and the latest clicks.
export default async function ClicksAdminPage() {
  if (!(await checkAdminAuth())) return <LoginForm />;

  const supabase = getSupabaseAdmin();
  const [months, perfumes, latest] = await Promise.all([
    supabase.from('store_click_months').select('store, month, clicks').order('month', { ascending: false }).order('clicks', { ascending: false }).limit(300),
    supabase.from('store_click_perfumes').select('perfume_key, clicks').order('clicks', { ascending: false }).limit(30),
    supabase.from('store_clicks').select('id, created_at, store, perfume_key, country, price, currency, size_ml').order('created_at', { ascending: false }).limit(40),
  ]);
  const missing = [months, perfumes, latest].some(r => r.error);

  const byMonth = new Map<string, Month[]>();
  for (const m of (months.data ?? []) as Month[]) byMonth.set(m.month, [...(byMonth.get(m.month) ?? []), m]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back to the dashboard</Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heebo)' }}>Clicks to stores</h1>
        <p className="mb-8 text-sm text-slate-500">
          Every click on &quot;To the store&quot; in the price panel, counted when it leaves the site (robots are not counted). The store sees the visit as
          <code className="mx-1 rounded bg-slate-200 px-1">utm_source=matchscent</code> in its own statistics.
          {missing ? ' The table is not there yet: run db-migrations/2026-09-v6-store-clicks.sql in the Supabase SQL Editor.' : ''}
        </p>

        <h2 className="mb-3 text-lg font-bold text-slate-900">Per store and month</h2>
        {byMonth.size === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No clicks yet.</p>
        ) : (
          [...byMonth.entries()].map(([month, rows]) => (
            <div key={month} className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                <span>{fmtMonth(month)}</span>
                <span>{rows.reduce((n, r) => n + r.clicks, 0)} clicks</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(r => (
                    <tr key={r.store} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-900">{r.store}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900">{r.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}

        <h2 className="mb-3 mt-10 text-lg font-bold text-slate-900">Most clicked perfumes, last 30 days</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <tbody>
              {((perfumes.data ?? []) as { perfume_key: string; clicks: number }[]).map(p => (
                <tr key={p.perfume_key} className="border-t border-slate-100 first:border-0">
                  <td className="px-4 py-2"><Link href={`/perfume/${p.perfume_key}`} className="text-slate-900 hover:underline">{p.perfume_key}</Link></td>
                  <td className="px-4 py-2 text-right font-bold text-slate-900">{p.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-10 text-lg font-bold text-slate-900">Latest clicks</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <tbody>
              {((latest.data ?? []) as Click[]).map(c => (
                <tr key={c.id} className="border-t border-slate-100 first:border-0">
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">{new Date(c.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' })}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{c.store}</td>
                  <td className="px-4 py-2 text-slate-700">{c.perfume_key}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{c.price ? `${Math.round(c.price)} ${c.currency ?? ''}` : ''}{c.size_ml ? ` · ${c.size_ml} ml` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
