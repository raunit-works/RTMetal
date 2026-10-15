'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getWishlistProducts } from '@/lib/supabase/wishlist';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { WishlistItem } from '@/lib/types';
import { ProductCard } from '@/components/sections/product-card';
import { SectionHeading } from '@/components/sections/section-heading';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { wishlistCount } = useWishlist();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<WishlistItem[]>([]);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const loadWishlistData = React.useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirectTo=/wishlist');
        return;
      }

      const wishlistData = await getWishlistProducts();
      setItems(wishlistData);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadWishlistData();
  }, [loadWishlistData, wishlistCount]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold-deep" />
          <p className="text-sm text-muted-foreground">Loading saved wishlist items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-10 space-y-12">
        <SectionHeading
          eyebrow="Saved Collection"
          title={
            <>
              My <span className="gold-text">Wishlist.</span>
            </>
          }
          description="Your saved home decor and lifestyle pieces, stored securely in your customer profile."
        />

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center space-y-5 max-w-lg mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
              <Heart className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-medium">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Discover our hand-finished home decor and lifestyle collection and click the heart icon to save your favorite pieces.
              </p>
            </div>
            <Button
              asChild
              className="rounded-full gold-button font-semibold px-8"
              size="lg"
            >
              <Link href="/home-decor">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Explore Home Decor Catalog
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                {item.product && <ProductCard product={item.product} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
