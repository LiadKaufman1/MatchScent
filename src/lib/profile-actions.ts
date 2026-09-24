'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from './supabase-server';

type Result = { success: true } | { success: false; error: string };

// The visitor edits their OWN profile: display name and a short text about themselves.
// The session decides whose row it is (never an id sent by the browser), and the database's
// row-level security enforces it a second time.
export async function updateProfile(displayName: string, bio: string): Promise<Result> {
  const name = displayName.replace(/\s+/g, ' ').trim();
  const text = bio.trim();
  if (name.length < 2 || name.length > 40) return { success: false, error: 'invalid name' };
  if (text.length > 300) return { success: false, error: 'bio too long' };

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'not logged in' };

  // "bio" exists only after the v3 migration; without it, save the name alone.
  let { error } = await supabase.from('profiles').update({ display_name: name, bio: text || null }).eq('id', user.id);
  if (error) ({ error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id));
  if (error) return { success: false, error: error.message };

  revalidatePath('/u/[id]', 'page');
  revalidatePath('/en/u/[id]', 'page');
  revalidatePath('/perfume/[slug]', 'page');
  revalidatePath('/en/perfume/[slug]', 'page');
  return { success: true };
}
