import { createSupabaseBrowserClient } from './client';
import { getProductsAsync } from '../data-access';
import type { Product, WishlistItem } from '../types';

/**
 * Fetch all saved product IDs for the authenticated customer.
 * Uses RLS policy wishlists_select_own (auth.uid() = user_id).
 */
export async function getWishlistProductIds(): Promise<string[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase Error] getWishlistProductIds failed:', error.message);
      return [];
    }

    return (data || []).map((row) => row.product_id);
  } catch (err) {
    console.error('[Supabase Exception] getWishlistProductIds:', err);
    return [];
  }
}

/**
 * Fetch full Product items saved in the authenticated customer's wishlist.
 * Enforces is_published = true via catalog data-access.
 */
export async function getWishlistProducts(): Promise<WishlistItem[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: wishlistRows, error } = await supabase
      .from('wishlists')
      .select('id, user_id, product_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Error] getWishlistProducts failed:', error.message);
      return [];
    }

    if (!wishlistRows || wishlistRows.length === 0) {
      return [];
    }

    // Fetch published products catalog
    const allProducts = await getProductsAsync();
    const productMap = new Map<string, Product>();
    allProducts.forEach((p) => {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
    });

    const results: WishlistItem[] = [];
    for (const row of wishlistRows) {
      const matchedProduct = productMap.get(row.product_id);
      // Filter out unpublished or missing products from customer display
      if (matchedProduct) {
        results.push({
          id: row.id,
          userId: row.user_id,
          productId: row.product_id,
          createdAt: row.created_at,
          product: matchedProduct,
        });
      }
    }

    return results;
  } catch (err) {
    console.error('[Supabase Exception] getWishlistProducts:', err);
    return [];
  }
}

/**
 * Add a product to the authenticated customer's wishlist.
 * Uses auth.uid() derived from the active session.
 */
export async function addToWishlist(productId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'You must be signed in to add items to your wishlist.' };
    }

    const { error } = await supabase
      .from('wishlists')
      .insert([{ user_id: user.id, product_id: productId }]);

    if (error) {
      // 23505 is unique constraint violation (already in wishlist)
      if (error.code === '23505') {
        return { success: true, message: 'Product is already in your wishlist.' };
      }
      console.error('[Supabase Error] addToWishlist failed:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Exception] addToWishlist:', err);
    return { success: false, message: err?.message || 'Failed to update wishlist.' };
  }
}

/**
 * Remove a product from the authenticated customer's wishlist.
 * Uses auth.uid() derived from the active session.
 */
export async function removeFromWishlist(productId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'You must be signed in to manage your wishlist.' };
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('[Supabase Error] removeFromWishlist failed:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Exception] removeFromWishlist:', err);
    return { success: false, message: err?.message || 'Failed to update wishlist.' };
  }
}

/**
 * Convenience toggle helper delegating to explicit add/remove operations.
 */
export async function toggleWishlist(productId: string, isSaved: boolean): Promise<{ success: boolean; action: 'added' | 'removed'; message?: string }> {
  if (isSaved) {
    const res = await removeFromWishlist(productId);
    return { success: res.success, action: 'removed', message: res.message };
  } else {
    const res = await addToWishlist(productId);
    return { success: res.success, action: 'added', message: res.message };
  }
}
