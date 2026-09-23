'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from './supabase-server';

// After a rating/review changes, refresh every perfume page (both languages) so the
// new average/list shows up. Simple and consistent with refreshPublicPages() in
// actions.ts; a single perfume's exact page would be cheaper to target, but at this
// scale the blanket revalidation is not worth the extra bookkeeping.
const refreshPerfumePages = () => {
  revalidatePath('/perfume/[slug]', 'page');
  revalidatePath('/en/perfume/[slug]', 'page');
};

type Result = { success: true } | { success: false; error: string };

export async function submitRating(perfumeId: string, score: number): Promise<Result> {
  if (!Number.isInteger(score) || score < 1 || score > 5) return { success: false, error: 'invalid score' };

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase
    .from('ratings')
    .upsert({ perfume_id: perfumeId, user_id: user.id, score }, { onConflict: 'perfume_id,user_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

export async function submitReview(perfumeId: string, body: string): Promise<Result> {
  const trimmed = body.trim();
  if (trimmed.length < 10 || trimmed.length > 2000) return { success: false, error: 'invalid length' };

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase
    .from('reviews')
    .upsert({ perfume_id: perfumeId, user_id: user.id, body: trimmed }, { onConflict: 'perfume_id,user_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}
