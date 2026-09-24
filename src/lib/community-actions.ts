'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { getSupabaseServer } from './supabase-server';
import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from './supabase-admin';
import { getSupabase } from './supabase';
import { hasBlockedWord } from './catalog';
import { noteGroups } from './notes';
import { CHOICE_SIZES, isVoteKind, type ChoiceKind } from './community-types';

// After something community-made changes, refresh every perfume page (both languages) so the
// new numbers show up. Simple and consistent with refreshPublicPages() in actions.ts; a
// single perfume's exact page would be cheaper to target, but at this scale the blanket
// revalidation is not worth the extra bookkeeping.
const refreshPerfumePages = () => {
  revalidatePath('/perfume/[slug]', 'page');
  revalidatePath('/en/perfume/[slug]', 'page');
  // The home page and the charts show the latest community activity too.
  revalidatePath('/');
  revalidatePath('/en');
  revalidatePath('/top');
  revalidatePath('/en/top');
};

// Refreshing the pages is done AFTER the answer went back to the browser: otherwise every vote
// waits for the whole perfume page to be rebuilt first (several seconds), and the buttons feel stuck.
const refreshSoon = () => after(() => refreshPerfumePages());

type Result = { success: true } | { success: false; error: string };

// The error the pages turn into "please don't use that word" (see hasBlockedWord in catalog.ts).
const BLOCKED = { success: false as const, error: 'blocked word' };

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

  refreshSoon();
  return { success: true };
}

export async function removeRating(perfumeId: string): Promise<Result> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };
  const { error } = await supabase.from('ratings').delete().eq('perfume_id', perfumeId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };
  refreshSoon();
  return { success: true };
}

export async function submitReview(perfumeId: string, body: string): Promise<Result> {
  const trimmed = body.trim();
  if (trimmed.length < 10 || trimmed.length > 2000) return { success: false, error: 'invalid length' };
  if (hasBlockedWord(trimmed)) return BLOCKED;

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase
    .from('reviews')
    .upsert({ perfume_id: perfumeId, user_id: user.id, body: trimmed }, { onConflict: 'perfume_id,user_id' });
  if (error) return { success: false, error: error.message };

  refreshSoon();
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

  refreshSoon();
  return { success: true };
}

const MAX_POINTS_PER_KIND = 5;

// A short pro or con of a perfume, written by a visitor.
export async function addPoint(perfumeId: string, kind: 'pro' | 'con', body: string): Promise<Result & { id?: string }> {
  if (kind !== 'pro' && kind !== 'con') return { success: false, error: 'invalid kind' };
  const trimmed = body.replace(/\s+/g, ' ').trim();
  if (trimmed.length < 3 || trimmed.length > 140) return { success: false, error: 'invalid length' };
  if (hasBlockedWord(trimmed)) return BLOCKED;

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

  refreshSoon();
  return { success: true, id: data.id as string };
}

export async function deletePoint(pointId: string): Promise<Result> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };
  const { error } = await supabase.from('perfume_points').delete().eq('id', pointId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };
  refreshSoon();
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

  refreshSoon();
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

  refreshSoon();
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

  refreshSoon();
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

  refreshSoon();
  return { success: true };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- comments on reviews ---------------------------------------------------------------

export async function addComment(reviewId: string, body: string): Promise<Result & { id?: string }> {
  const trimmed = body.replace(/\s+\n/g, '\n').trim();
  if (!UUID.test(reviewId)) return { success: false, error: 'invalid review' };
  if (trimmed.length < 2 || trimmed.length > 1000) return { success: false, error: 'invalid length' };
  if (hasBlockedWord(trimmed)) return BLOCKED;

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: user.id, body: trimmed })
    .select('id')
    .single();
  if (error) return { success: false, error: error.message };

  refreshSoon();
  return { success: true, id: data.id as string };
}

export async function deleteComment(commentId: string): Promise<Result> {
  if (!UUID.test(commentId)) return { success: false, error: 'invalid comment' };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };
  const { error } = await supabase.from('review_comments').delete().eq('id', commentId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };
  refreshSoon();
  return { success: true };
}

// --- "I smell this note" -------------------------------------------------------------------

export async function toggleNoteVote(perfumeId: string, note: string, on: boolean): Promise<Result> {
  const key = note.trim().toLowerCase();
  if (!UUID.test(perfumeId) || !key || key.length > 80) return { success: false, error: 'invalid note' };

  // Only notes that are really in this perfume's pyramid can be voted on.
  const { data: perfume } = await getSupabase().from('perfumes').select('note_pyramid').eq('id', perfumeId).maybeSingle();
  const known = noteGroups(perfume?.note_pyramid).some(g => g.notes.some(n => n.trim().toLowerCase() === key));
  if (!known) return { success: false, error: 'unknown note' };

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = on
    ? await supabase.from('note_votes').upsert({ perfume_id: perfumeId, user_id: user.id, note: key }, { onConflict: 'perfume_id,user_id,note' })
    : await supabase.from('note_votes').delete().eq('perfume_id', perfumeId).eq('user_id', user.id).eq('note', key);
  if (error) return { success: false, error: error.message };

  refreshSoon();
  return { success: true };
}

// --- members' photos ----------------------------------------------------------------------
// The browser shrinks the picture first (so it stays well under the upload limit); here we check
// what really arrived (size and the file's first bytes, not just its name), keep it in a PRIVATE
// bucket, and it waits for the owner's approval in /admin/community before anyone sees it.

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const sniffImage = (b: Uint8Array): { type: string; ext: string } | null => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: 'image/png', ext: 'png' };
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { type: 'image/webp', ext: 'webp' };
  return null;
};

export async function uploadPhoto(formData: FormData): Promise<Result> {
  const perfumeId = String(formData.get('perfumeId') ?? '');
  const file = formData.get('file');
  if (!UUID.test(perfumeId)) return { success: false, error: 'invalid perfume' };
  if (formData.get('own') !== 'yes') return { success: false, error: 'not own photo' };
  if (!(file instanceof File) || file.size < 2000 || file.size > MAX_PHOTO_BYTES) return { success: false, error: 'invalid file' };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { success: false, error: 'invalid file' };

  const { user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const admin = getSupabaseAdmin();
  // No more than 20 photos waiting per member (the database also allows only 3 per perfume).
  const { count } = await admin
    .from('perfume_photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending');
  if ((count ?? 0) >= 20) return { success: false, error: 'too many' };

  const path = `${user.id}/${randomUUID()}.${kind.ext}`;
  const up = await admin.storage.from('photo-uploads').upload(path, bytes, { contentType: kind.type, upsert: false });
  if (up.error) return { success: false, error: up.error.message };

  const { error } = await admin.from('perfume_photos').insert({ perfume_id: perfumeId, user_id: user.id, storage_path: path });
  if (error) {
    await admin.storage.from('photo-uploads').remove([path]);
    return { success: false, error: /3 photos/.test(error.message) ? 'too many' : error.message };
  }
  return { success: true };
}

export async function deleteMyPhoto(photoId: string): Promise<Result> {
  if (!UUID.test(photoId)) return { success: false, error: 'invalid photo' };
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { data: photo } = await supabase.from('perfume_photos').select('storage_path, user_id').eq('id', photoId).maybeSingle();
  if (!photo || photo.user_id !== user.id) return { success: false, error: 'not found' };

  const { error } = await supabase.from('perfume_photos').delete().eq('id', photoId).eq('user_id', user.id);
  if (error) return { success: false, error: error.message };
  const admin = getSupabaseAdmin();
  await Promise.all([
    admin.storage.from('photo-uploads').remove([photo.storage_path]),
    admin.storage.from('community-photos').remove([photo.storage_path]),
  ]);
  refreshSoon();
  return { success: true };
}

// --- suggestions ----------------------------------------------------------------------------
// "similar": a fragrance that smells like this perfume. "perfume": a perfume missing from the site.
// Nothing is shown until the owner approves it in /admin/community.

const brandKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

export async function submitSuggestion(input: {
  kind: 'similar' | 'perfume';
  perfumeId?: string;
  brand: string;
  name: string;
  gender?: 'male' | 'female' | 'unisex' | null;
  note?: string;
}): Promise<Result> {
  const brand = (input.brand ?? '').replace(/\s+/g, ' ').trim();
  const name = (input.name ?? '').replace(/\s+/g, ' ').trim();
  const note = (input.note ?? '').trim();
  if (input.kind !== 'similar' && input.kind !== 'perfume') return { success: false, error: 'invalid kind' };
  if (brand.length < 1 || brand.length > 80 || name.length < 1 || name.length > 120 || note.length > 500) return { success: false, error: 'invalid length' };
  if (hasBlockedWord(`${brand} ${name} ${note}`)) return BLOCKED;
  const gender = input.kind === 'perfume' && input.gender && ['male', 'female', 'unisex'].includes(input.gender) ? input.gender : null;

  let perfumeId: string | null = null;
  if (input.kind === 'similar') {
    if (!input.perfumeId || !UUID.test(input.perfumeId)) return { success: false, error: 'invalid perfume' };
    perfumeId = input.perfumeId;
    // The rule of the site: an "inspired by" fragrance is never from the same house as the original.
    const { data: original } = await getSupabase().from('perfumes').select('brand').eq('id', perfumeId).maybeSingle();
    if (!original) return { success: false, error: 'invalid perfume' };
    const a = brandKey(original.brand), b = brandKey(brand);
    if (a && b && (a === b || a.includes(b) || b.includes(a))) return { success: false, error: 'same brand' };
  }

  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: 'not logged in' };

  const { error } = await supabase.from('suggestions').insert({
    user_id: user.id, kind: input.kind, perfume_id: perfumeId, brand, name, gender, note: note || null,
  });
  if (error) return { success: false, error: /10 waiting/.test(error.message) ? 'too many' : error.message };
  return { success: true };
}
