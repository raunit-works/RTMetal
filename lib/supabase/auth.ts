import { createSupabaseServerClient } from './server';
import type { User, Session } from '@supabase/supabase-js';

export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getAuthSession(): Promise<Session | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
}
