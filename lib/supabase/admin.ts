import { createSupabaseServerClient } from './server';

export async function verifyAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null; email: string | null }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isAdmin: false, userId: null, email: null };
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', {
      user_id: user.id,
    });

    if (rpcError || !isAdmin) {
      return { isAdmin: false, userId: user.id, email: user.email ?? null };
    }

    return { isAdmin: true, userId: user.id, email: user.email ?? null };
  } catch {
    return { isAdmin: false, userId: null, email: null };
  }
}
