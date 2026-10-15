'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  getWishlistProductIds,
  addToWishlist,
  removeFromWishlist,
} from '@/lib/supabase/wishlist';

interface WishlistContextType {
  wishlistIds: Set<string>;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addItem: (productId: string) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  toggleItem: (productId: string) => Promise<{ success: boolean; action?: 'added' | 'removed'; message?: string }>;
  loading: boolean;
  isGuestPromptOpen: boolean;
  openGuestPrompt: () => void;
  closeGuestPrompt: () => void;
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [isGuestPromptOpen, setIsGuestPromptOpen] = React.useState<boolean>(false);

  const loadWishlist = React.useCallback(async (userId?: string) => {
    setLoading(true);
    try {
      if (!userId) {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAuthenticated(false);
          setWishlistIds(new Set());
          setLoading(false);
          return;
        }
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(true);
      }

      const ids = await getWishlistProductIds();
      setWishlistIds(new Set(ids));
    } catch {
      setWishlistIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          loadWishlist(user.id);
        } else {
          setIsAuthenticated(false);
          setWishlistIds(new Set());
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadWishlist(session.user.id);
        } else {
          setIsAuthenticated(false);
          setWishlistIds(new Set());
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, [loadWishlist]);

  const isInWishlist = React.useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const addItem = React.useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        setIsGuestPromptOpen(true);
        return false;
      }

      // Optimistic update
      setWishlistIds((prev) => new Set(prev).add(productId));

      const res = await addToWishlist(productId);
      if (!res.success) {
        // Rollback on failure
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        return false;
      }
      return true;
    },
    [isAuthenticated]
  );

  const removeItem = React.useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        setIsGuestPromptOpen(true);
        return false;
      }

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      const res = await removeFromWishlist(productId);
      if (!res.success) {
        // Rollback on failure
        setWishlistIds((prev) => new Set(prev).add(productId));
        return false;
      }
      return true;
    },
    [isAuthenticated]
  );

  const toggleItem = React.useCallback(
    async (productId: string): Promise<{ success: boolean; action?: 'added' | 'removed'; message?: string }> => {
      if (!isAuthenticated) {
        setIsGuestPromptOpen(true);
        return { success: false, message: 'Sign in to save items to your wishlist.' };
      }

      const currentlySaved = wishlistIds.has(productId);
      if (currentlySaved) {
        const ok = await removeItem(productId);
        return { success: ok, action: 'removed' };
      } else {
        const ok = await addItem(productId);
        return { success: ok, action: 'added' };
      }
    },
    [isAuthenticated, wishlistIds, addItem, removeItem]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.size,
        isInWishlist,
        addItem,
        removeItem,
        toggleItem,
        loading,
        isGuestPromptOpen,
        openGuestPrompt: () => setIsGuestPromptOpen(true),
        closeGuestPrompt: () => setIsGuestPromptOpen(false),
      }}
    >
      {children}

      {/* Guest Prompt Modal for Logged-Out Users */}
      {isGuestPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4 text-center">
            <h3 className="font-display text-xl font-medium">Sign in required</h3>
            <p className="text-sm text-muted-foreground">
              Please sign in to save items to your persistent wishlist and access them anytime.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsGuestPromptOpen(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsGuestPromptOpen(false);
                  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
                  router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
                }}
                className="flex-1 rounded-full gold-button py-2.5 text-xs font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
