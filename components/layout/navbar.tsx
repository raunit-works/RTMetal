'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, MessageCircle, User, LogOut, LogIn, Shield, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getCategories, getServices } from '@/lib/data-access';
import { whatsappLink } from '@/lib/site';
import { resolveIcon } from '@/lib/icons';
import { Wrench } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const categories = getCategories();
const services = getServices();

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    href: '/home-decor',
    mega: true,
  },
  {
    label: 'Services',
    href: '/metal-coating',
    dropdown: true,
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#contact' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const [scrolled, setScrolled] = React.useState(false);

  const isDarkPageHeader =
    pathname === '/about' ||
    pathname === '/metal-coating' ||
    pathname === '/home-decor' ||
    (pathname ? pathname.startsWith('/home-decor/') : false);
  const isTransparentDark = !scrolled && isDarkPageHeader;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Auth session & admin state listener
  React.useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();

      const checkAdminStatus = async (u: SupabaseUser | null) => {
        if (!u) {
          setIsAdmin(false);
          return;
        }
        try {
          const { data } = await supabase.rpc('is_admin', { user_id: u.id });
          setIsAdmin(data === true);
        } catch {
          setIsAdmin(false);
        }
      };

      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        checkAdminStatus(user);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        checkAdminStatus(u);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Browser client init safety
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setUserMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch {
      // Sign out error safety
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/60'
            : 'bg-transparent'
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 lg:px-10">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <span className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold tracking-tight transition-colors group-hover:border-gold',
              isTransparentDark ? 'border-white/40 text-white' : 'border-foreground/30 text-foreground'
            )}>
              R
            </span>
            <span className={cn(
              'font-display text-xl font-medium tracking-tight sm:text-2xl',
              isTransparentDark ? 'text-white' : 'text-foreground'
            )}>
              RT PU <span className="gold-text">COATING</span> WORKS
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <li
                key={link.label}
                className="relative"
                onMouseEnter={() => {
                  if (link.mega) setMegaOpen(true);
                  if (link.dropdown) setServicesOpen(true);
                }}
                onMouseLeave={() => {
                  if (link.mega) setMegaOpen(false);
                  if (link.dropdown) setServicesOpen(false);
                }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isTransparentDark
                      ? 'text-white/80 hover:text-white'
                      : 'text-foreground/80 hover:text-foreground'
                  )}
                >
                  {link.label}
                  {link.mega && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-300" />
                  )}
                  {link.dropdown && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-300" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                'rounded-full px-5',
                isTransparentDark
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-foreground/20'
              )}
            >
              <a
                href={whatsappLink(
                  "Hello RT PU COATING WORKS, I'd like to enquire about your services."
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>

            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'rounded-full border px-3 flex items-center gap-2',
                    isTransparentDark
                      ? 'border-white/30 text-white hover:bg-white/10'
                      : 'border-border'
                  )}
                >
                  <User className="h-4 w-4 text-gold-deep" />
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  {wishlistCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink">
                      {wishlistCount}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-border/60 mb-1">
                      <p className="text-xs font-semibold truncate">{user.user_metadata?.full_name || 'Account'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors mb-1"
                    >
                      <User className="h-3.5 w-3.5 text-gold-deep" />
                      My Account
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors mb-1"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-destructive" />
                        <span>My Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="rounded-full bg-gold/20 text-gold-deep px-2 py-0.5 text-[10px] font-bold">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gold-deep hover:bg-gold/10 transition-colors mb-1"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                asChild
                variant="default"
                size="sm"
                className="rounded-full gold-button font-medium px-4"
              >
                <Link href="/login">
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>


          <button
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border lg:hidden',
              isTransparentDark ? 'border-white/30 text-white' : 'border-border'
            )}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden lg:block"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <div className="mx-auto max-w-7xl px-10 pb-6">
                <div className="rounded-2xl border border-border bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-ultra text-muted-foreground">
                      Shop by Category
                    </p>
                    <Link
                      href="/home-decor"
                      className="text-xs font-medium text-gold-deep hover:text-gold"
                    >
                      View all collections →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/home-decor?category=${cat.slug}`}
                        className="group flex gap-4 rounded-xl p-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{cat.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {cat.tagline}
                          </p>
                          <p className="mt-1 text-xs font-medium text-gold-deep">
                            {cat.productCount} pieces
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden lg:block"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <div className="mx-auto max-w-7xl px-10 pb-6">
                <div className="w-80 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
                  {services.map((svc) => {
                    const SvcIcon = resolveIcon(svc.icon, Wrench);
                    return (
                      <Link
                        key={svc.slug}
                        href={`/metal-coating#${svc.slug}`}
                        className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60"
                      >
                        <SvcIcon className="mt-0.5 h-5 w-5 text-gold-deep" />
                        <div>
                          <p className="text-sm font-semibold">{svc.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {svc.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col bg-background shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <span className="font-display text-xl font-medium">
                  RT PU <span className="gold-text">COATING</span> WORKS
                </span>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {user && (
                  <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                    <p className="text-xs font-semibold">{user.user_metadata?.full_name || 'Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    
                    <div className="pt-2 flex flex-col gap-2 border-t border-border/40">
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 text-xs font-medium text-foreground hover:underline"
                      >
                        <User className="h-3.5 w-3.5 text-gold-deep" />
                        My Account
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between text-xs font-medium text-foreground hover:underline"
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="h-3.5 w-3.5 text-destructive" />
                          <span>My Wishlist</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span className="rounded-full bg-gold/20 text-gold-deep px-2 py-0.5 text-[10px] font-bold">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 text-xs font-medium text-gold-deep hover:underline"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          handleSignOut();
                        }}
                        className="flex items-center gap-2 text-xs font-medium text-destructive hover:underline pt-1"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}

                <p className="mb-3 text-xs font-medium uppercase tracking-ultra text-muted-foreground">
                  Menu
                </p>
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-3 text-lg font-medium transition-colors hover:bg-muted"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {!user && (
                    <li>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-3 text-lg font-medium text-gold-deep hover:bg-muted"
                      >
                        Sign In / Sign Up
                      </Link>
                    </li>
                  )}
                </ul>

                <p className="mb-3 mt-8 text-xs font-medium uppercase tracking-ultra text-muted-foreground">
                  Collections
                </p>
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/home-decor?category=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="mb-3 mt-8 text-xs font-medium uppercase tracking-ultra text-muted-foreground">
                  Services
                </p>
                <ul className="space-y-1">
                  {services.map((svc) => (
                    <li key={svc.slug}>
                      <Link
                        href={`/metal-coating#${svc.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
                      >
                        {svc.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-border p-6">
                <Button
                  asChild
                  className="w-full rounded-full"
                  size="lg"
                >
                  <a
                    href={whatsappLink(
                      "Hello RT PU COATING WORKS, I'd like to enquire about your services."
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
