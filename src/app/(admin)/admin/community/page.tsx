import Link from 'next/link';
import { checkAdminAuth } from '@/lib/actions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import LoginForm from '../components/LoginForm';
import ModerationList, { type ModerationItem } from './ModerationList';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  body: string;
  created_at: string;
  kind?: string;
  author: { display_name: string } | { display_name: string }[] | null;
  perfume: { brand: string; name: string } | { brand: string; name: string }[] | null;
};
const one = <T,>(x: T | T[] | null): T | undefined => (Array.isArray(x) ? x[0] : x ?? undefined);

// The newest reviews and pros/cons, with a delete button - so abusive content can be removed.
export default async function CommunityAdminPage() {
  if (!(await checkAdminAuth())) return <LoginForm />;

  const supabase = getSupabaseAdmin();
  const [reviews, points] = await Promise.all([
    supabase.from('reviews').select('id, body, created_at, author:profiles(display_name), perfume:perfumes(brand, name)').order('created_at', { ascending: false }).limit(100),
    supabase.from('perfume_points').select('id, body, kind, created_at, author:profiles(display_name), perfume:perfumes(brand, name)').order('created_at', { ascending: false }).limit(100),
  ]);

  const toItem = (r: Row, type: 'review' | 'point'): ModerationItem => ({
    id: r.id,
    type,
    body: r.body,
    label: type === 'point' ? (r.kind === 'con' ? 'con' : 'pro') : 'review',
    author: one(r.author)?.display_name ?? '?',
    perfume: `${one(r.perfume)?.brand ?? ''} ${one(r.perfume)?.name ?? ''}`.trim(),
    createdAt: r.created_at,
  });

  const items = [
    ...((reviews.data ?? []) as Row[]).map(r => toItem(r, 'review')),
    ...((points.data ?? []) as Row[]).map(r => toItem(r, 'point')),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back to the dashboard</Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heebo)' }}>Community moderation</h1>
        <p className="mb-8 text-sm text-slate-500">
          The newest reviews and pros/cons. Deleting removes the item from the site within a moment (pages refresh at once).
          {reviews.error || points.error ? ' (Some tables are not there yet - run the community migrations.)' : ''}
        </p>
        <ModerationList items={items} />
      </div>
    </div>
  );
}
