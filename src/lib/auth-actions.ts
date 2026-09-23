'use server';

import { getSupabaseServer } from './supabase-server';

type Result = { success: true } | { success: false; error: string };

export async function registerUser(email: string, password: string, displayName: string): Promise<Result> {
  const name = displayName.trim();
  if (!name) return { success: false, error: 'missing display name' };
  if (password.length < 8) return { success: false, error: 'password too short' };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } }, // read by the "handle_new_user" trigger
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function loginUser(email: string, password: string): Promise<Result> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function logoutUser(): Promise<Result> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}
