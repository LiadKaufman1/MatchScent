'use server';

import { getSupabaseServer } from './supabase-server';

// needsConfirmation only ever comes back true from registerUser(); the other actions
// just leave it out, so callers can check `result.needsConfirmation` either way.
type Result = { success: true; needsConfirmation?: boolean } | { success: false; error: string };

export async function registerUser(email: string, password: string, displayName: string): Promise<Result> {
  const name = displayName.trim();
  if (!name) return { success: false, error: 'missing display name' };
  if (password.length < 8) return { success: false, error: 'password too short' };

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } }, // read by the "handle_new_user" trigger
  });
  if (error) return { success: false, error: error.message };
  // If "Confirm email" is off in Supabase, signUp already returns a live session (the
  // visitor is logged in immediately) - only ask them to check their email otherwise.
  return { success: true, needsConfirmation: !data.session };
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
