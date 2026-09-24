'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from './supabase-server';
import { CHOICE_SIZES, isVoteKind, type ChoiceKind } from './community-types';

// After something community-made changes, refresh every perfume page (both languages) so the
// new numbers show up. Simple and consistent with refreshPublicPages() in actions.ts; a
// single perfume's exact page would be cheaper to target, but at this scale the blanket
// revalidation is not worth the extra bookkeeping.
const refreshPerfumePages = () => {
  revalidatePath('/perfume/[slug]', 'page');
  revalidatePath('/en/perfume/[slug]', 'page');
};

type Result = { success: true } | { success: false; error: string };

// Every action checks the session itself (the browser's word is never trusted) and writes
// with the visitor's own session, so the database's row-level security has the last say.
async function currentUser() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const validStars = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;
const DETAIL_KEYS = ['scent', 'bottle'] as const;
export type RatingDetails = Partial<Record<(typeof DETAIL_KEYS)[number], number | null>>;

// "score" is love (5) / like (4) / ok (3) / dislike (2) / hate (1). "details" are the optional
// scent / bottle stars. Only the listed columns are ever written (whitelist) - and only when
// they were actually given, so a visitor who has not rated the details never overwrites
// earlier ones with blanks.
export async function submitRating(perfumeId: string, score: number, details: RatingDetails = {}): Promise<Result> {
  if (!validStars(score)) return { success: false, error: 'invalid score' };
  const extra: RatingDetails = {};
  for (const key of DETAIL_KEYS) {
    const value = details[key];
    if (value === undefined || value === null) continue;
    if (!validStars(value)) return { success: false, error: 'invalid detail' };
    extra[key] = value;
  }

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase
    .from('ratings')
    .upsert({ perfume_id: perfumeId, user_id: user.id, score, ...extra }, { onConflict: 'perfume_id,user_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

export async function removeRating(perfumeId: string): Promise<Result> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };
  const { error } = await supabase.from('ratings').delete().eq('perfume_id', perfumeId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };
  refreshPerfumePages();
  return { success: true };
}

export async function submitReview(perfumeId: string, body: string): Promise<Result> {
  const trimmed = body.trim();
  if (trimmed.length < 10 || trimmed.length > 2000) return { success: false, error: 'invalid length' };

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase
    .from('reviews')
    .upsert({ perfume_id: perfumeId, user_id: user.id, body: trimmed }, { onConflict: 'perfume_id,user_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

// One answer of the vote panels: longevity / sillage / gender / price value (pick one) and
// "when to wear" (each season / day / night is its own on-off vote). value = null takes the
// visitor's vote back.
export async function castVote(perfumeId: string, kind: string, value: number | null): Promise<Result> {
  if (!isVoteKind(kind)) return { success: false, error: 'invalid kind' };
  if (value !== null) {
    const max = kind.startsWith('wear_') ? 1 : CHOICE_SIZES[kind as ChoiceKind];
    if (!Number.isInteger(value) || value < 1 || value > max) return { success: false, error: 'invalid value' };
  }

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = value === null
    ? await supabase.from('perfume_votes').delete().eq('perfume_id', perfumeId).eq('user_id', user.id).eq('kind', kind)
    : await supabase.from('perfume_votes').upsert({ perfume_id: perfumeId, user_id: user.id, kind, value }, { onConflict: 'perfume_id,user_id,kind' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

const MAX_POINTS_PER_KIND = 5;

// A short pro or con of a perfume, written by a visitor.
export async function addPoint(perfumeId: string, kind: 'pro' | 'con', body: string): Promise<Result & { id?: string }> {
  if (kind !== 'pro' && kind !== 'con') return { success: false, error: 'invalid kind' };
  const trimmed = body.replace(/\s+/g, ' ').trim();
  if (trimmed.length < 3 || trimmed.length > 140) return { success: false, error: 'invalid length' };

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { count } = await supabase
    .from('perfume_points')
    .select('id', { count: 'exact', head: true })
    .eq('perfume_id', perfumeId)
    .eq('user_id', user.id)
    .eq('kind', kind);
  if ((count ?? 0) >= MAX_POINTS_PER_KIND) return { success: false, error: 'too many' };

  const { data, error } = await supabase
    .from('perfume_points')
    .insert({ perfume_id: perfumeId, user_id: user.id, kind, body: trimmed })
    .select('id')
    .single();
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true, id: data.id as string };
}

export async function deletePoint(pointId: string): Promise<Result> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };
  const { error } = await supabase.from('perfume_points').delete().eq('id', pointId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };
  refreshPerfumePages();
  return { success: true };
}

// +1 = agree, -1 = disagree, 0 = take my vote back.
export async function votePoint(pointId: string, vote: -1 | 0 | 1): Promise<Result> {
  if (![-1, 0, 1].includes(vote)) return { success: false, error: 'invalid vote' };

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = vote === 0
    ? await supabase.from('point_votes').delete().eq('point_id', pointId).eq('user_id', user.id)
    : await supabase.from('point_votes').upsert({ point_id: pointId, user_id: user.id, vote }, { onConflict: 'point_id,user_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

// "This review was helpful" on / off.
export async function markReviewHelpful(reviewId: string, on: boolean): Promise<Result> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = on
    ? await supabase.from('review_votes').upsert({ review_id: reviewId, user_id: user.id }, { onConflict: 'review_id,user_id' })
    : await supabase.from('review_votes').delete().eq('review_id', reviewId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}

// +1 = "yes, it smells like the original", -1 = "no", 0 = take my vote back.
export async function voteEntry(perfumeId: string, entryKey: string, vote: -1 | 0 | 1): Promise<Result> {
  if (![-1, 0, 1].includes(vote)) return { success: false, error: 'invalid vote' };
  if (!entryKey || entryKey.length > 200) return { success: false, error: 'invalid entry' };

  const { supabase, user } = await currentUser();
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

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = status === null
    ? await supabase.from('collections').delete().eq('perfume_id', perfumeId).eq('user_id', user.id)
    : await supabase.from('collections').upsert({ perfume_id: perfumeId, user_id: user.id, status }, { onConflict: 'user_id,perfume_id' });
  if (error) return { success: false, error: error.message };

  refreshPerfumePages();
  return { success: true };
}
