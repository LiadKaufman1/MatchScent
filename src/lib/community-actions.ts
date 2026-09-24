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

const validStars = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;
const ASPECTS = ['scent', 'longevity', 'sillage', 'bottle', 'value'] as const;
export type RatingDetails = Partial<Record<(typeof ASPECTS)[number], number | null>>;

// "details" are the optional scent / longevity / sillage / bottle / value stars. Only the
// listed columns are ever written (whitelist) - and only when they were actually given, so a
// visitor who has not rated the details never overwrites earlier ones with blanks.
export async function submitRating(perfumeId: string, score: number, details: RatingDetails = {}): Promise<Result> {
  if (!validStars(score)) return { success: false, error: 'invalid score' };
  const extra: RatingDetails = {};
  for (const key of ASPECTS) {
    const value = details[key];
    if (value === undefined || value === null) continue;
    if (!validStars(value)) return { success: false, error: 'invalid detail' };
    extra[key] = value;
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase
    .from('ratings')
    .upsert({ perfume_id: perfumeId, user_id: user.id, score, ...extra }, { onConflict: 'perfume_id,user_id' });
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

// +1 = "yes, it smells like the original", -1 = "no", 0 = take my vote back.
export async function voteEntry(perfumeId: string, entryKey: string, vote: -1 | 0 | 1): Promise<Result> {
  if (![-1, 0, 1].includes(vote)) return { success: false, error: 'invalid vote' };
  if (!entryKey || entryKey.length > 200) return { success: false, error: 'invalid entry' };

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = vote === 0
    ? await supabase.from('entry_votes').delete().eq('perfume_id', perfumeId).eq('entry_key', entryKey).eq('user_id', user.id)
    : await supabase
        .from('entry_votes')
        .upsert({ perfume_id: perfumeId, entry_key: entryKey, user_id: user.id, vote }, { onConflict: 'perfume_id,entry_key,user_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

// Put a perfume on the visitor's shelf ("own" / "had" / "want"), or take it off (null).
export async function setShelf(perfumeId: string, status: 'own' | 'had' | 'want' | null): Promise<Result> {
  if (status !== null && !['own', 'had', 'want'].includes(status)) return { success: false, error: 'invalid status' };

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = status === null
    ? await supabase.from('collections').delete().eq('perfume_id', perfumeId).eq('user_id', user.id)
    : await supabase.from('collections').upsert({ perfume_id: perfumeId, user_id: user.id, status }, { onConflict: 'user_id,perfume_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}
