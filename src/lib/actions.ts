'use server';

import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';
import { getSupabaseAdmin } from './supabase-admin';
import type { Dupe } from './supabase';

// Generate a static signature based on the password for the cookie.
// If ADMIN_PASSWORD is not set, nobody can log in (there is no default password).
const getAdminToken = () => {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD is not configured');
  return crypto.createHmac('sha256', password).update('admin_session').digest('hex');
};

// Compare two strings without leaking how many characters matched (timing attacks).
const safeEqual = (a: string, b: string) => {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// Middleware-like check for admin actions
const checkAuth = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !safeEqual(token, getAdminToken())) {
    throw new Error('Unauthorized');
  }
};

// Server actions can be called directly by anyone, so only these columns can ever be
// written from the admin forms (never id, created_at, live price caches, etc).
const PERFUME_FIELDS = ['name', 'brand', 'image_url'] as const;
const DUPE_FIELDS = [
  'name', 'brand', 'image_url', 'similarity_score', 'price_usd', 'price_ils',
  'purchase_link_il', 'purchase_link_amazon', 'notes',
] as const;

const pick = (data: Record<string, unknown>, fields: readonly string[]) => {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in data) out[f] = data[f];
  }
  return out;
};

// After an admin edit, refresh the home page and every perfume page, in both languages, plus the sitemap.
const refreshPublicPages = () => {
  revalidateTag('catalog', { expire: 0 });
  revalidatePath('/');
  revalidatePath('/en');
  revalidatePath('/perfume/[slug]', 'page');
  revalidatePath('/en/perfume/[slug]', 'page');
  revalidatePath('/sitemap.xml');
};

type PerfumeInput = { name: string; brand: string; image_url: string };
type DupeInput = Partial<Pick<Dupe, (typeof DUPE_FIELDS)[number]>>;

export async function loginAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (expected && typeof password === 'string' && safeEqual(password, expected)) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', getAdminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Invalid password' };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return { success: true };
}

export async function checkAdminAuth() {
  try {
    await checkAuth();
    return true;
  } catch {
    return false;
  }
}

// --- Perfume Management ---

export async function updatePerfume(id: string, data: PerfumeInput) {
  await checkAuth();
  const { error } = await getSupabaseAdmin().from('perfumes').update(pick(data, PERFUME_FIELDS)).eq('id', id);
  if (error) throw new Error(error.message);
  refreshPublicPages();
  revalidatePath('/admin');
  return { success: true };
}

// --- Dupe Management ---

export async function updateDupe(id: string, data: DupeInput) {
  await checkAuth();
  const fields = pick(data, DUPE_FIELDS);
  if (Object.keys(fields).length === 0) throw new Error('Nothing to update');
  const { error } = await getSupabaseAdmin().from('dupes').update(fields).eq('id', id);
  if (error) throw new Error(error.message);
  refreshPublicPages();
  revalidatePath('/admin');
  return { success: true };
}

export async function addDupe(data: DupeInput & { original_perfume_id: string }) {
  await checkAuth();
  const fields = pick(data, [...DUPE_FIELDS, 'original_perfume_id']);
  const { error } = await getSupabaseAdmin().from('dupes').insert([fields]);
  if (error) throw new Error(error.message);
  refreshPublicPages();
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteDupe(id: string) {
  await checkAuth();
  const { error } = await getSupabaseAdmin().from('dupes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  refreshPublicPages();
  revalidatePath('/admin');
  return { success: true };
}

// --- Community moderation: remove abusive reviews and pros/cons ---
// (Members can only delete their own; only the admin can delete anyone's. Uses the service role.)

const refreshCommunityPages = () => {
  revalidatePath('/perfume/[slug]', 'page');
  revalidatePath('/en/perfume/[slug]', 'page');
  revalidatePath('/u/[id]', 'page');
  revalidatePath('/en/u/[id]', 'page');
  revalidatePath('/admin/community');
};

export async function adminDeleteReview(id: string) {
  await checkAuth();
  if (typeof id !== 'string' || !id) throw new Error('Invalid id');
  const { error } = await getSupabaseAdmin().from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  refreshCommunityPages();
  return { success: true };
}

export async function adminDeletePoint(id: string) {
  await checkAuth();
  if (typeof id !== 'string' || !id) throw new Error('Invalid id');
  const { error } = await getSupabaseAdmin().from('perfume_points').delete().eq('id', id);
  if (error) throw new Error(error.message);
  refreshCommunityPages();
  return { success: true };
}

export async function adminDeleteComment(id: string) {
  await checkAuth();
  if (typeof id !== 'string' || !id) throw new Error('Invalid id');
  const { error } = await getSupabaseAdmin().from('review_comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  refreshCommunityPages();
  return { success: true };
}

// --- Members' photos: approve (copy to the public bucket), reject, or delete ---

export async function adminReviewPhoto(id: string, approve: boolean) {
  await checkAuth();
  if (typeof id !== 'string' || !id) throw new Error('Invalid id');
  const admin = getSupabaseAdmin();
  const { data: photo, error } = await admin.from('perfume_photos').select('id, storage_path').eq('id', id).single();
  if (error || !photo) throw new Error(error?.message ?? 'Photo not found');

  if (approve) {
    const file = await admin.storage.from('photo-uploads').download(photo.storage_path);
    if (file.error) throw new Error(file.error.message);
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    const up = await admin.storage.from('community-photos').upload(photo.storage_path, bytes, { contentType: file.data.type || 'image/jpeg', upsert: true });
    if (up.error) throw new Error(up.error.message);
    const publicUrl = admin.storage.from('community-photos').getPublicUrl(photo.storage_path).data.publicUrl;
    const { error: e2 } = await admin.from('perfume_photos').update({ status: 'approved', public_url: publicUrl, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (e2) throw new Error(e2.message);
  } else {
    const { error: e2 } = await admin.from('perfume_photos').update({ status: 'rejected', public_url: null, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (e2) throw new Error(e2.message);
    await admin.storage.from('community-photos').remove([photo.storage_path]);
  }
  await admin.storage.from('photo-uploads').remove([photo.storage_path]);
  refreshCommunityPages();
  revalidatePath('/');
  revalidatePath('/en');
  return { success: true };
}

export async function adminDeletePhoto(id: string) {
  await checkAuth();
  if (typeof id !== 'string' || !id) throw new Error('Invalid id');
  const admin = getSupabaseAdmin();
  const { data: photo } = await admin.from('perfume_photos').select('storage_path').eq('id', id).maybeSingle();
  const { error } = await admin.from('perfume_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  if (photo) {
    await admin.storage.from('photo-uploads').remove([photo.storage_path]);
    await admin.storage.from('community-photos').remove([photo.storage_path]);
  }
  refreshCommunityPages();
  revalidatePath('/');
  revalidatePath('/en');
  return { success: true };
}

// --- Suggestions: approve (adds the similar scent / the perfume to the catalog) or reject ---
// The owner may correct the spelling first; only these fields can be changed.

type SuggestionEdits = { brand?: string; name?: string; gender?: string | null };

export async function adminReviewSuggestion(id: string, approve: boolean, edits: SuggestionEdits = {}) {
  await checkAuth();
  if (typeof id !== 'string' || !id) throw new Error('Invalid id');
  const admin = getSupabaseAdmin();
  const { data: s, error } = await admin.from('suggestions').select('id, kind, perfume_id, brand, name, gender, status').eq('id', id).single();
  if (error || !s) throw new Error(error?.message ?? 'Suggestion not found');
  if (s.status !== 'pending') throw new Error('Already handled');

  if (approve) {
    const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
    const brand = clean(edits.brand, 80) || s.brand;
    const name = clean(edits.name, 120) || s.name;
    const gender = ['male', 'female', 'unisex'].includes(String(edits.gender ?? s.gender)) ? String(edits.gender ?? s.gender) : null;

    if (s.kind === 'similar') {
      const { data: existing } = await admin.from('dupes').select('id, brand, name').eq('original_perfume_id', s.perfume_id);
      const already = (existing ?? []).some(d => d.brand.toLowerCase() === brand.toLowerCase() && d.name.toLowerCase() === name.toLowerCase());
      if (!already) {
        // Community suggestions go to the end of the list (the imported lists use 100 ... 64).
        const { error: e2 } = await admin.from('dupes').insert({ original_perfume_id: s.perfume_id, brand, name, similarity_score: 50 });
        if (e2) throw new Error(e2.message);
      }
    } else {
      const exact = (v: string) => v.replace(/[\\%_]/g, c => `\\${c}`); // ilike without wildcards
      const { data: existing } = await admin.from('perfumes').select('id').ilike('brand', exact(brand)).ilike('name', exact(name)).limit(1);
      if (!existing?.length) {
        const { error: e2 } = await admin.from('perfumes').insert({ brand, name, gender });
        if (e2) throw new Error(e2.message);
      }
    }
  }

  const { error: e3 } = await admin.from('suggestions').update({ status: approve ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
  if (e3) throw new Error(e3.message);
  if (approve) refreshPublicPages();
  revalidatePath('/admin/community');
  return { success: true };
}

// --- Problem reports sent by visitors (table site_reports, see /admin/reports) ---

const reportId = (formData: FormData) => {
  const id = Number(formData.get('id'));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export async function setReportHandled(formData: FormData): Promise<void> {
  await checkAuth();
  const id = reportId(formData);
  if (id === null) return;
  await getSupabaseAdmin().from('site_reports').update({ handled: formData.get('handled') === '1' }).eq('id', id);
  revalidatePath('/admin/reports');
}

export async function deleteReport(formData: FormData): Promise<void> {
  await checkAuth();
  const id = reportId(formData);
  if (id === null) return;
  await getSupabaseAdmin().from('site_reports').delete().eq('id', id);
  revalidatePath('/admin/reports');
}
