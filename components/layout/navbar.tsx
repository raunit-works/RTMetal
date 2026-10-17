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

/* ─── Dark header palette (scoped constants) ─── */
const HDR = {
  bg:        'rgba(25, 24, 22, 0.97)',
  bgScroll:  'rgba(20, 19, 17, 0.88)',
  border:    'rgba(255,255,255,0.07)',
  borderScr: 'rgba(255,255,255,0.08)',
  shadow:    '0 6px 24px rgba(0,0,0,0.08)',
  text:      '#EEEAE3',
  textMuted: '#EEEAE3',   /* opacity applied via CSS */
  brass:     '#C99B4C',
  logoLight: '#F3EFE8',
  ivory:     '#F4F0E8',
  ddBg:      '#211F1C',
  ddBorder:  'rgba(255,255,255,0.08)',
  ddShadow:  '0 12px 32px rgba(0,0,0,0.16)',
  ddHover:   'rgba(255,255,255,0.06)',
  mobileBg:  '#191816',
  mobileText:'#F1EEE8',
  signInBg:  '#E8D3A9',
  signInBgH: '#D7B875',
  signInText:'#1C1A17',
} as const;

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [headerMounted, setHeaderMounted] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Initial page-load entrance animation (once only)
  React.useEffect(() => {
    const t = setTimeout(() => setHeaderMounted(true), 60);
    return () => clearTimeout(t);
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

  /* ─── Determine if a nav link is the currently active page ─── */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <>
      {/* ══════════════════════════════════════════════
          HEADER — Desktop + Mobile top bar
          ══════════════════════════════════════════════ */}
      <header
        className="rt-header fixed inset-x-0 top-0 z-50"
        style={{
          background: scrolled ? HDR.bgScroll : HDR.bg,
          borderBottom: `1px solid ${scrolled ? HDR.borderScr : HDR.border}`,
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          boxShadow: scrolled ? HDR.shadow : 'none',
          transition:
            'background-color 300ms ease, backdrop-filter 300ms ease, border-color 300ms ease, box-shadow 300ms ease, height 300ms ease',
          /* Optional subtle entrance */
          opacity: headerMounted ? 1 : 0,
          transform: headerMounted ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <nav
          className="mx-auto flex items-center justify-between px-5 lg:px-10"
          style={{
            maxWidth: '1360px',
            height: scrolled ? '70px' : '76px',
            transition: 'height 300ms ease',
          }}
        >
          {/* ── LOGO / BRAND ── */}
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold tracking-tight transition-colors"
              style={{
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: HDR.ivory,
                background: 'transparent',
              }}
            >
              R
            </span>
            <span
              className="font-display text-xl font-medium tracking-tight sm:text-2xl"
              style={{ color: HDR.logoLight }}
            >
              RT PU <span className="gold-text">COATING</span> WORKS
            </span>
          </Link>

          {/* ── DESKTOP NAV LINKS ── */}
          <ul className="hidden items-center lg:flex" style={{ gap: '6px' }}>
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
                  className="rt-nav-link group flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    color: isActive(link.href) ? HDR.ivory : HDR.textMuted,
                    opacity: isActive(link.href) ? 1 : 0.85,
                    transition: 'color 200ms ease, opacity 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = HDR.brass;
                    (e.currentTarget as HTMLElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = isActive(link.href) ? HDR.ivory : HDR.textMuted;
                    (e.currentTarget as HTMLElement).style.opacity = isActive(link.href) ? '1' : '0.85';
                  }}
                >
                  {link.label}
                  {link.mega && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-300" />
                  )}
                  {link.dropdown && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-300" />
                  )}
                </Link>
                {/* Brass underline — animated on hover */}
                <span
                  className="rt-nav-underline"
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '16px',
                    right: '16px',
                    height: '1px',
                    background: HDR.brass,
                    transform: isActive(link.href) ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 220ms ease',
                  }}
                />
              </li>
            ))}
          </ul>

          {/* ── DESKTOP CTA BUTTONS ── */}
          <div className="hidden items-center lg:flex" style={{ gap: '12px' }}>
            {/* WhatsApp */}
            <a
              href={whatsappLink(
                "Hello RT PU COATING WORKS, I'd like to enquire about your services."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rt-wa-btn inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                height: '36px',
                paddingLeft: '20px',
                paddingRight: '20px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.28)',
                color: HDR.ivory,
                transition: 'background 200ms ease, border-color 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.45)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.28)';
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" style={{ color: HDR.ivory }} />
              WhatsApp
            </a>

            {/* Sign In / User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="rounded-full px-3 flex items-center gap-2"
                  style={{
                    border: '1px solid rgba(255,255,255,0.28)',
                    color: HDR.ivory,
                    background: 'transparent',
                    transition: 'background 200ms ease, border-color 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.28)';
                  }}
                >
                  <User className="h-4 w-4" style={{ color: HDR.brass }} />
                  <span className="text-xs font-medium max-w-[100px] truncate" style={{ color: HDR.ivory }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  {wishlistCount > 0 && (
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: HDR.brass, color: HDR.signInText }}
                    >
                      {wishlistCount}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 p-2"
                    style={{
                      background: HDR.ddBg,
                      border: `1px solid ${HDR.ddBorder}`,
                      borderRadius: '10px',
                      boxShadow: HDR.ddShadow,
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                    }}
                  >
                    <div className="px-3 py-2 mb-1" style={{ borderBottom: `1px solid ${HDR.ddBorder}` }}>
                      <p className="text-xs font-semibold truncate" style={{ color: HDR.ivory }}>{user.user_metadata?.full_name || 'Account'}</p>
                      <p className="text-[11px] truncate" style={{ color: 'rgba(238,234,227,0.55)' }}>{user.email}</p>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-1"
                      style={{ color: HDR.ivory }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = HDR.ddHover;
                        (e.currentTarget as HTMLElement).style.color = HDR.brass;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = HDR.ivory;
                      }}
                    >
                      <User className="h-3.5 w-3.5" style={{ color: HDR.brass }} />
                      My Account
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-1"
                      style={{ color: HDR.ivory }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = HDR.ddHover;
                        (e.currentTarget as HTMLElement).style.color = HDR.brass;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = HDR.ivory;
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5" style={{ color: '#c75050' }} />
                        <span>My Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(201,155,76,0.2)', color: HDR.brass }}
                        >
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-1"
                        style={{ color: HDR.brass }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(201,155,76,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                      style={{ color: '#d87070' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(216,112,112,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rt-signin-btn inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  height: '36px',
                  paddingLeft: '18px',
                  paddingRight: '18px',
                  background: HDR.signInBg,
                  color: HDR.signInText,
                  borderRadius: '26px',
                  transition: 'background 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = HDR.signInBgH;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = HDR.signInBg;
                }}
              >
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
          </div>

          {/* ── MOBILE HAMBURGER ── */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
            style={{
              border: '1px solid rgba(255,255,255,0.30)',
              color: HDR.ivory,
            }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        {/* ══════════════════════════════════════════════
            MEGA DROPDOWN — Products
            ══════════════════════════════════════════════ */}
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
              <div className="mx-auto px-10 pb-6" style={{ maxWidth: '1360px' }}>
                <div
                  className="p-6"
                  style={{
                    background: HDR.ddBg,
                    border: `1px solid ${HDR.ddBorder}`,
                    borderRadius: '12px',
                    boxShadow: HDR.ddShadow,
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-ultra" style={{ color: 'rgba(238,234,227,0.5)' }}>
                      Shop by Category
                    </p>
                    <Link
                      href="/home-decor"
                      className="text-xs font-medium transition-colors"
                      style={{ color: HDR.brass }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = '0.8';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = '1';
                      }}
                    >
                      View all collections →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/home-decor?category=${cat.slug}`}
                        className="group flex gap-4 rounded-xl p-3 transition-colors"
                        style={{ color: '#ECE8E1' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = HDR.ddHover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
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
                          <p className="text-sm font-semibold" style={{ color: '#ECE8E1' }}>{cat.name}</p>
                          <p className="mt-0.5 text-xs" style={{ color: 'rgba(236,232,225,0.55)' }}>
                            {cat.tagline}
                          </p>
                          <p className="mt-1 text-xs font-medium" style={{ color: HDR.brass }}>
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

        {/* ══════════════════════════════════════════════
            DROPDOWN — Services
            ══════════════════════════════════════════════ */}
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
              <div className="mx-auto px-10 pb-6" style={{ maxWidth: '1360px' }}>
                <div
                  className="w-80 p-3"
                  style={{
                    background: HDR.ddBg,
                    border: `1px solid ${HDR.ddBorder}`,
                    borderRadius: '10px',
                    boxShadow: HDR.ddShadow,
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                  }}
                >
                  {services.map((svc) => {
                    const SvcIcon = resolveIcon(svc.icon, Wrench);
                    return (
                      <Link
                        key={svc.slug}
                        href={`/metal-coating#${svc.slug}`}
                        className="group flex items-start gap-3 rounded-xl p-3 transition-colors"
                        style={{ color: '#ECE8E1' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = HDR.ddHover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <SvcIcon className="mt-0.5 h-5 w-5" style={{ color: HDR.brass }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#ECE8E1' }}>{svc.name}</p>
                          <p className="mt-0.5 text-xs" style={{ color: 'rgba(236,232,225,0.55)' }}>
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

      {/* ══════════════════════════════════════════════
          MOBILE MENU DRAWER
          ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] lg:hidden"
              style={{ background: 'rgba(15,14,12,0.55)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col lg:hidden"
              style={{
                background: HDR.mobileBg,
                boxShadow: '0 0 60px rgba(0,0,0,0.4)',
              }}
            >
              {/* Mobile drawer top */}
              <div
                className="flex items-center justify-between px-6 py-5"
                style={{ borderBottom: `1px solid ${HDR.ddBorder}` }}
              >
                <span className="font-display text-xl font-medium" style={{ color: HDR.mobileText }}>
                  RT PU <span className="gold-text">COATING</span> WORKS
                </span>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    border: `1px solid ${HDR.ddBorder}`,
                    color: HDR.mobileText,
                  }}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Logged-in user block */}
                {user && (
                  <div
                    className="mb-6 rounded-xl p-4 space-y-2"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${HDR.ddBorder}`,
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: HDR.mobileText }}>
                      {user.user_metadata?.full_name || 'Account'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(241,238,232,0.5)' }}>
                      {user.email}
                    </p>
                    
                    <div className="pt-2 flex flex-col gap-2" style={{ borderTop: `1px solid ${HDR.ddBorder}` }}>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 text-xs font-medium"
                        style={{ color: HDR.mobileText }}
                      >
                        <User className="h-3.5 w-3.5" style={{ color: HDR.brass }} />
                        My Account
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between text-xs font-medium"
                        style={{ color: HDR.mobileText }}
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="h-3.5 w-3.5" style={{ color: '#c75050' }} />
                          <span>My Wishlist</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: 'rgba(201,155,76,0.2)', color: HDR.brass }}
                          >
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 text-xs font-medium"
                          style={{ color: HDR.brass }}
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
                        className="flex items-center gap-2 text-xs font-medium pt-1"
                        style={{ color: '#d87070' }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}

                <p
                  className="mb-3 text-xs font-medium uppercase tracking-ultra"
                  style={{ color: 'rgba(241,238,232,0.4)' }}
                >
                  Menu
                </p>
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-3 text-lg font-medium transition-colors"
                        style={{
                          color: isActive(link.href) ? HDR.brass : HDR.mobileText,
                        }}
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
                        className="block rounded-lg px-3 py-3 text-lg font-medium"
                        style={{ color: HDR.brass }}
                      >
                        Sign In / Sign Up
                      </Link>
                    </li>
                  )}
                </ul>

                <p
                  className="mb-3 mt-8 text-xs font-medium uppercase tracking-ultra"
                  style={{ color: 'rgba(241,238,232,0.4)' }}
                >
                  Collections
                </p>
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/home-decor?category=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm transition-colors"
                        style={{ color: 'rgba(241,238,232,0.7)' }}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <p
                  className="mb-3 mt-8 text-xs font-medium uppercase tracking-ultra"
                  style={{ color: 'rgba(241,238,232,0.4)' }}
                >
                  Services
                </p>
                <ul className="space-y-1">
                  {services.map((svc) => (
                    <li key={svc.slug}>
                      <Link
                        href={`/metal-coating#${svc.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm transition-colors"
                        style={{ color: 'rgba(241,238,232,0.7)' }}
                      >
                        {svc.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile drawer footer */}
              <div className="p-6" style={{ borderTop: `1px solid ${HDR.ddBorder}` }}>
                <a
                  href={whatsappLink(
                    "Hello RT PU COATING WORKS, I'd like to enquire about your services."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full text-sm font-medium"
                  style={{
                    height: '44px',
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid rgba(255,255,255,0.15)`,
                    color: HDR.mobileText,
                    transition: 'background 200ms ease',
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Hover underline injection via CSS (scoped to .rt-header) ── */}
      <style jsx global>{`
        /* Nav hover underline reveal */
        .rt-header .rt-nav-underline {
          pointer-events: none;
        }
        .rt-header li:hover .rt-nav-underline {
          transform: scaleX(1) !important;
        }
        /* Focus styles for accessibility */
        .rt-header a:focus-visible,
        .rt-header button:focus-visible {
          outline: 2px solid ${HDR.brass};
          outline-offset: 2px;
          border-radius: 4px;
        }
        /* Prevent entrance animation from replaying */
        .rt-header {
          transition: opacity 450ms ease, transform 450ms ease,
                      background-color 300ms ease, backdrop-filter 300ms ease,
                      border-color 300ms ease, box-shadow 300ms ease;
        }
      `}</style>
    </>
  );
}
