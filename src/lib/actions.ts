'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase-admin';

// Generate a static signature based on the password for the cookie
const getAdminToken = () => {
  const password = process.env.ADMIN_PASSWORD || 'default_secure_password';
  return crypto.createHmac('sha256', password).update('admin_session').digest('hex');
};

// Middleware-like check for admin actions
const checkAuth = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== getAdminToken()) {
    throw new Error('Unauthorized');
  }
};

export async function loginAdmin(password: string) {
  if (password === process.env.ADMIN_PASSWORD) {
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
  } catch (error) {
    return false;
  }
}

// --- Perfume Management ---

export async function updatePerfume(id: string, data: { name: string; brand: string; image_url: string }) {
  await checkAuth();
  const { error } = await supabaseAdmin.from('perfumes').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

// --- Dupe Management ---

export async function updateDupe(id: string, data: any) {
  await checkAuth();
  const { error } = await supabaseAdmin.from('dupes').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function addDupe(data: any) {
  await checkAuth();
  const { error } = await supabaseAdmin.from('dupes').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteDupe(id: string) {
  await checkAuth();
  const { error } = await supabaseAdmin.from('dupes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}
