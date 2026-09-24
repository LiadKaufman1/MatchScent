import Link from 'next/link';
import { checkAdminAuth } from '@/lib/actions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import LoginForm from '../components/LoginForm';
import ModerationList, { type ModerationItem } from './ModerationList';
import PhotoModeration, { type PhotoItem } from './PhotoModeration';
import SuggestionModeration, { type SuggestionItem } from './SuggestionModeration';

export const dynamic = 'force-dynamic';

type Person = { display_name: string } | { display_name: string }[] | null;
type Perfume = { brand: string; name: string } | { brand: string; name: string }[] | null;
type Row = { id: string; body: string; created_at: string; kind?: string; author: Person; perfume: Perfume };
type CommentRow = { id: string; body: string; created_at: string; author: Person; review: { perfume: Perfume } | { perfume: Perfume }[] | null };
const one = <T,>(x: T | T[] | null | undefined): T | undefined => (Array.isArray(x) ? x[0] : x ?? undefined);
const perfumeName = (p: Perfume) => `${one(p)?.brand ?? ''} ${one(p)?.name ?? ''}`.trim();

// Everything members add, in one place: photos and suggestions waiting for approval, and the
// newest reviews / replies / pros-cons with a delete button - so abusive content can be removed.
export default async function CommunityAdminPage() {
  if (!(await checkAdminAuth())) return <LoginForm />;

  const supabase = getSupabaseAdmin();
  const [reviews, points, comments, photos, suggestions] = await Promise.all([
    supabase.from('reviews').select('id, body, created_at, author:profiles(display_name), perfume:perfumes(brand, name)').order('created_at', { ascending: false }).limit(100),
    supabase.from('perfume_points').select('id, body, kind, created_at, author:profiles(display_name), perfume:perfumes(brand, name)').order('created_at', { ascending: false }).limit(100),
    supabase.from('review_comments').select('id, body, created_at, author:profiles(display_name), review:reviews(perfume:perfumes(brand, name))').order('created_at', { ascending: false }).limit(100),
    supabase.from('perfume_photos').select('id, status, storage_path, public_url, created_at, author:profiles(display_name), perfume:perfumes(brand, name)').in('status', ['pending', 'approved']).order('created_at', { ascending: false }).limit(100),
    supabase.from('suggestions').select('id, kind, brand, name, gender, note, created_at, author:profiles(display_name), perfume:perfumes(brand, name)').eq('status', 'pending').order('created_at', { ascending: true }).limit(100),
  ]);

  const toItem = (r: Row, type: 'review' | 'point'): ModerationItem => ({
    id: r.id,
    type,
    body: r.body,
    label: type === 'point' ? (r.kind === 'con' ? 'con' : 'pro') : 'review',
    author: one(r.author)?.display_name ?? '?',
    perfume: perfumeName(r.perfume),
    createdAt: r.created_at,
  });

  const items: ModerationItem[] = [
    ...((reviews.data ?? []) as Row[]).map(r => toItem(r, 'review')),
    ...((points.data ?? []) as Row[]).map(r => toItem(r, 'point')),
    ...((comments.data ?? []) as CommentRow[]).map(c => ({
      id: c.id, type: 'comment' as const, body: c.body, label: 'reply',
      author: one(c.author)?.display_name ?? '?', perfume: perfumeName(one(c.review)?.perfume ?? null), createdAt: c.created_at,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Waiting photos live in a PRIVATE bucket: show them through short-lived signed links.
  type PhotoRow = { id: string; status: string; storage_path: string; public_url: string | null; created_at: string; author: Person; perfume: Perfume };
  const photoRows = (photos.data ?? []) as PhotoRow[];
  const pendingPaths = photoRows.filter(p => p.status === 'pending').map(p => p.storage_path);
  const signed = pendingPaths.length
    ? (await supabase.storage.from('photo-uploads').createSignedUrls(pendingPaths, 60 * 60)).data ?? []
    : [];
  const signedByPath = new Map(signed.map(s => [s.path, s.signedUrl]));
  const photoItems: PhotoItem[] = photoRows.map(p => ({
    id: p.id,
    status: p.status as 'pending' | 'approved',
    url: p.status === 'approved' ? p.public_url ?? '' : signedByPath.get(p.storage_path) ?? '',
    author: one(p.author)?.display_name ?? '?',
    perfume: perfumeName(p.perfume),
    createdAt: p.created_at,
  }));

  type SuggestionRow = { id: string; kind: 'similar' | 'perfume'; brand: string; name: string; gender: string | null; note: string | null; created_at: string; author: Person; perfume: Perfume };
  const suggestionItems: SuggestionItem[] = ((suggestions.data ?? []) as SuggestionRow[]).map(s => ({
    id: s.id, kind: s.kind, brand: s.brand, name: s.name, gender: s.gender, note: s.note,
    author: one(s.author)?.display_name ?? '?', perfume: perfumeName(s.perfume), createdAt: s.created_at,
  }));

  const missing = [reviews, points, comments, photos, suggestions].some(r => r.error);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back to the dashboard</Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heebo)' }}>Community moderation</h1>
        <p className="mb-8 text-sm text-slate-500">
          Photos and suggestions wait here for your approval; nothing from them is on the site before you approve it.
          Deleting removes an item from the site at once.
          {missing ? ' (Some tables are not there yet - run the community migrations.)' : ''}
        </p>

        <h2 className="mb-3 text-lg font-bold text-slate-900">Suggestions waiting ({suggestionItems.length})</h2>
        <SuggestionModeration items={suggestionItems} />

        <h2 className="mb-3 mt-10 text-lg font-bold text-slate-900">Members&apos; photos ({photoItems.filter(p => p.status === 'pending').length} waiting)</h2>
        <PhotoModeration items={photoItems} />

        <h2 className="mb-3 mt-10 text-lg font-bold text-slate-900">Reviews, replies, pros and cons</h2>
        <ModerationList items={items} />
      </div>
    </div>
  );
}
