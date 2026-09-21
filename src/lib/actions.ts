'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
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
  revalidatePath('/');
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
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function addDupe(data: DupeInput & { original_perfume_id: string }) {
  await checkAuth();
  const fields = pick(data, [...DUPE_FIELDS, 'original_perfume_id']);
  const { error } = await getSupabaseAdmin().from('dupes').insert([fields]);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteDupe(id: string) {
  await checkAuth();
  const { error } = await getSupabaseAdmin().from('dupes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}
