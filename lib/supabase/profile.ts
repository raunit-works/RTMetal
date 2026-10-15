import { createSupabaseBrowserClient } from './client';
import type { UserProfile } from '../types';

export async function getCustomerProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      console.error('[Supabase Error] getCustomerProfile failed:', error?.message);
      return null;
    }

    return {
      id: data.id,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      role: data.role as 'customer' | 'admin',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('[Supabase Exception] getCustomerProfile:', err);
    return null;
  }
}

export async function updateCustomerProfile(updates: {
  fullName?: string;
  phone?: string;
}): Promise<{ success: boolean; profile?: UserProfile; message?: string }> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'You must be signed in to update your profile.' };
    }

    const payloadToUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fullName !== undefined) {
      payloadToUpdate.full_name = updates.fullName.trim() || null;
    }

    if (updates.phone !== undefined) {
      payloadToUpdate.phone = updates.phone.trim() || null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payloadToUpdate)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Error] updateCustomerProfile failed:', error.message);
      return { success: false, message: error.message };
    }

    // Also update auth metadata for UI consistency
    if (updates.fullName !== undefined || updates.phone !== undefined) {
      await supabase.auth.updateUser({
        data: {
          full_name: payloadToUpdate.full_name,
          phone: payloadToUpdate.phone,
        },
      });
    }

    return {
      success: true,
      profile: {
        id: data.id,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        phone: data.phone,
        role: data.role as 'customer' | 'admin',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: any) {
    console.error('[Supabase Exception] updateCustomerProfile:', err);
    return { success: false, message: err?.message || 'Failed to update profile.' };
  }
}
