'use client';

import Image from 'next/image';
import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, MessageCircle, User, LogOut, LogIn, Shield, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getCategoriesAsync, getServices, getServicesAsync, isSupabaseAuthoritative } from '@/lib/data-access';
import { categoryHref, getCategoryPath, isCategoryInSection } from '@/lib/category-hierarchy';
import { whatsappLink, isHomeDecorWhatsappVerified, getMetalCoatingWhatsAppLink, isMetalCoatingWhatsappVerified } from '@/lib/site';
import { resolveIcon } from '@/lib/icons';
import { Wrench } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { Category, Service } from '@/lib/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const curatedServices = getServices();

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Home Decor',
    href: '/home-decor',
    mega: true,
  },
  {
    label: 'Metal Services',
    href: '/metal-coating',
    dropdown: true,
  },
  { label: 'Gallery', href: '/before-after' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#contact' },
];

/* ─── Dark header palette (scoped constants) ─── */
const HDR = {
  bg: 'rgba(25, 24, 22, 0.97)',
  bgScroll: 'rgba(20, 19, 17, 0.88)',
  border: 'rgba(255,255,255,0.07)',
  borderScr: 'rgba(255,255,255,0.08)',
  shadow: '0 6px 24px rgba(0,0,0,0.08)',
  text: '#EEEAE3',
  textMuted: '#EEEAE3',   /* opacity applied via CSS */
  brass: '#C99B4C',
  logoLight: '#F3EFE8',
  ivory: '#F4F0E8',
  ddBg: '#211F1C',
  ddBorder: 'rgba(255,255,255,0.08)',
  ddShadow: '0 12px 32px rgba(0,0,0,0.16)',
  ddHover: 'rgba(255,255,255,0.06)',
  mobileBg: '#191816',
  mobileText: '#F1EEE8',
  signInBg: '#E8D3A9',
  signInBgH: '#D7B875',
  signInText: '#1C1A17',
} as const;

type OpenMenu = 'products' | 'services' | null;

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<OpenMenu>(null);
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [headerMounted, setHeaderMounted] = React.useState(false);
  const [services, setServices] = React.useState<Service[]>(
    isSupabaseAuthoritative() ? [] : curatedServices,
  );
  const [configuredCategories, setConfiguredCategories] = React.useState<Category[]>([]);
  const homeDecorWhatsAppUrl = whatsappLink(
    "Hello RTMETALCOATING, I'd like to enquire about your services.",
  );
  const metalCoatingWhatsAppUrl = getMetalCoatingWhatsAppLink(
    "Hello RTMETALCOATING, I'd like to enquire about metal coating services.",
  );
  const navWhatsAppUrl = pathname.startsWith('/metal-coating')
    ? metalCoatingWhatsAppUrl
    : pathname.startsWith('/home-decor')
      ? homeDecorWhatsAppUrl
      : null;
  const categories = configuredCategories.filter((category) => isCategoryInSection(category, 'home_decor'));
  const metalCategories = configuredCategories.filter((category) => isCategoryInSection(category, 'metal_services'));

  // Refs for outside-click detection and keyboard focus management
  const productsRef = React.useRef<HTMLLIElement>(null);
  const servicesRef = React.useRef<HTMLLIElement>(null);
  const servicesTriggerRef = React.useRef<HTMLAnchorElement>(null);
  const servicesMenuRef = React.useRef<HTMLDivElement>(null);

  // Close timer ref — debounce mouseleave to bridge hover dead zone
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reduced motion preference
  const prefersReducedMotion = React.useRef(false);
  React.useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Close menu on route change
  React.useEffect(() => {
    setOpenMenu(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    let cancelled = false;

    getCategoriesAsync({ allowStaticFallback: false }).then((items) => {
      if (!cancelled) setConfiguredCategories(items);
    });

    getServicesAsync({ allowStaticFallback: false })
      .then((publishedServices) => {
        if (cancelled) return;
        setServices(publishedServices);
      })
      .catch(() => {
        if (cancelled) return;
        // In Supabase-authoritative mode, a database error must fail closed.
        // Static services must never override an admin's unpublished state.
        setServices(isSupabaseAuthoritative() ? [] : curatedServices.filter((s) => s.isPublished !== false));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Close menu on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Close menu on outside click
  React.useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        productsRef.current && !productsRef.current.contains(target) &&
        servicesRef.current && !servicesRef.current.contains(target)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  // Close Products on meaningful page scroll, but keep Services open
  // so its internally scrollable published list remains usable.
  React.useEffect(() => {
    if (openMenu !== 'products') return;
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [openMenu]);

  // Helpers for debounced hover open/close
  const handleMenuEnter = React.useCallback((menu: OpenMenu) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMenu(menu);
  }, []);

  const handleMenuLeave = React.useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
      closeTimerRef.current = null;
    }, 80); // 80ms debounce bridges the hover gap
  }, []);

  const focusFirstServiceItem = React.useCallback(() => {
    requestAnimationFrame(() => {
      servicesMenuRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    });
  }, []);

  const handleServiceTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (services.length === 0 || event.key !== 'ArrowDown') return;
      event.preventDefault();
      handleMenuEnter('services');
      focusFirstServiceItem();
    },
    [focusFirstServiceItem, handleMenuEnter, services.length]
  );

  const handleServicesMenuKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const menu = servicesMenuRef.current;
      if (!menu) return;

      const items = Array.from(
        menu.querySelectorAll<HTMLElement>('[role="menuitem"]')
      );
      if (items.length === 0) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpenMenu(null);
        servicesTriggerRef.current?.focus();
        return;
      }

      const activeIndex = items.indexOf(document.activeElement as HTMLElement);
      let nextIndex = -1;

      if (event.key === 'ArrowDown') {
        nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % items.length;
      } else if (event.key === 'ArrowUp') {
        nextIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = items.length - 1;
      }

      if (nextIndex >= 0) {
        event.preventDefault();
        items[nextIndex]?.focus();
      }
    },
    []
  );

  // Animation variants
  const dropdownMotion = prefersReducedMotion.current
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.01 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 6 }, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } };

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
            className="flex shrink-0 items-center"
            onClick={() => setMobileOpen(false)}
            aria-label="RT Metal Coating — Home"
          >
            <Image
              src="/brand/rt-logo.png"
              alt="RT Metal Coating"
              width={180}
              height={72}
              priority
              className="block h-12 w-auto max-w-[150px] object-contain sm:h-14 sm:max-w-[180px]"
            />
          </Link>


          {/* ── DESKTOP NAV LINKS ── */}
          <ul className="hidden items-center lg:flex" style={{ gap: '6px' }}>
            {navLinks.map((link) => {
              const isProducts = link.mega;
              const isServices = link.dropdown;
              const menuKey: OpenMenu = isProducts ? 'products' : isServices ? 'services' : null;
              const showServicesMenu = Boolean(isServices && services.length > 0);

              return (
                <li
                  key={link.label}
                  ref={isProducts ? productsRef : isServices ? servicesRef : undefined}
                  className="relative"
                  onMouseEnter={() => {
                    if (menuKey === 'services' && services.length === 0) return;
                    if (menuKey) handleMenuEnter(menuKey);
                  }}
                  onMouseLeave={() => {
                    if (
                      menuKey === 'services' &&
                      servicesRef.current?.contains(document.activeElement)
                    ) {
                      return;
                    }
                    if (menuKey) handleMenuLeave();
                  }}
                >
                  <Link
                    ref={isServices ? servicesTriggerRef : undefined}
                    href={link.href}
                    className="rt-nav-link group flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium"
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
                    aria-haspopup={
                      isProducts ? 'true' : showServicesMenu ? 'menu' : undefined
                    }
                    aria-expanded={
                      menuKey && (isProducts || showServicesMenu)
                        ? openMenu === menuKey
                        : undefined
                    }
                    aria-controls={
                      showServicesMenu ? 'navbar-services-menu' : undefined
                    }
                    onKeyDown={
                      isServices ? handleServiceTriggerKeyDown : undefined
                    }
                    onClick={() => {
                      if (menuKey) setOpenMenu(null);
                    }}
                  >
                    {link.label}
                    {(isProducts || showServicesMenu) && (
                      <ChevronDown
                        className="h-3.5 w-3.5 opacity-60 transition-transform duration-300"
                        style={{
                          transform: openMenu === menuKey ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
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

                  {/* ── PRODUCTS MEGA DROPDOWN (inside <li>) ── */}
                  {isProducts && (
                    <div
                      className="absolute top-full left-1/2 hidden pt-2 lg:block"
                      style={{ transform: 'translateX(-50%)', width: 'max-content', maxWidth: '780px', pointerEvents: openMenu === 'products' ? 'auto' : 'none' }}
                    >
                      <AnimatePresence>
                        {openMenu === 'products' && (
                          <motion.div
                            {...dropdownMotion}
                            role="menu"
                            onFocus={() => handleMenuEnter('products')}
                            onBlur={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setOpenMenu(null);
                              }
                            }}
                          >
                            <div
                              className="rt-services-scroll p-6"
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
                                  onClick={() => setOpenMenu(null)}
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
                                    href={categoryHref(cat)}
                                    className="group flex gap-4 rounded-xl p-3 transition-colors"
                                    style={{ color: '#ECE8E1' }}
                                    role="menuitem"
                                    onClick={() => setOpenMenu(null)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLElement).style.background = HDR.ddHover;
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                  >
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                                      <Image
                                        src={cat.image}
                                        alt={cat.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-semibold" style={{ color: '#ECE8E1' }}>{getCategoryPath(cat, categories)}</p>
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
                              {categories.length === 0 && <p className="text-sm text-white/60">No published collections available yet.</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ── SERVICES DROPDOWN (inside <li>) ── */}
                  {isServices && (
                    <div
                      className="absolute top-full left-1/2 hidden pt-2 lg:block"
                      style={{ transform: 'translateX(-50%)', pointerEvents: openMenu === 'services' ? 'auto' : 'none' }}
                    >
                      <AnimatePresence>
                        {openMenu === 'services' && showServicesMenu && (
                          <motion.div
                            {...dropdownMotion}
                            role="menu"
                            aria-label="Metal services"
                            onFocus={() => handleMenuEnter('services')}
                            onBlur={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setOpenMenu(null);
                              }
                            }}
                          >
                            <div
                              ref={servicesMenuRef}
                              id="navbar-services-menu"
                              className="rt-services-scroll w-80 p-3"
                              onKeyDown={handleServicesMenuKeyDown}
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
                                    href={`/metal-coating/${svc.slug}`}
                                    className="group flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors"
                                    style={{ color: '#ECE8E1' }}
                                    role="menuitem"
                                    onClick={() => setOpenMenu(null)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLElement).style.background = HDR.ddHover;
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                  >
                                    <SvcIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: HDR.brass }} />
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-semibold" style={{ color: '#ECE8E1' }}>{svc.name}</p>
                                      <p className="mt-0.5 line-clamp-2 break-words text-xs" style={{ color: 'rgba(236,232,225,0.55)' }}>
                                        {svc.description}
                                      </p>
                                    </div>
                                  </Link>
                                );
                              })}
                              {metalCategories.length > 0 && (
                                <div className="mt-3 border-t border-white/10 pt-3">
                                  <Link
                                    href="/metal-coating#collections"
                                    role="menuitem"
                                    onClick={() => setOpenMenu(null)}
                                    className="block rounded-xl p-3 text-sm text-white/80 hover:bg-white/5"
                                  >
                                    View Metal Collections
                                  </Link>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ── DESKTOP CTA BUTTONS ── */}
          <div className="hidden items-center lg:flex" style={{ gap: '12px' }}>
            {/* WhatsApp */}
            {navWhatsAppUrl ? (
              <a
                href={navWhatsAppUrl}
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
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom">
                  {metalCoatingWhatsAppUrl ? (
                    <DropdownMenuItem
                      onClick={() => window.open(metalCoatingWhatsAppUrl, '_blank', 'noopener,noreferrer')}
                    >
                      Metal Coating Enquiry
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled>
                      Metal Coating Enquiry
                    </DropdownMenuItem>
                  )}
                  {homeDecorWhatsAppUrl ? (
                    <DropdownMenuItem
                      onClick={() => window.open(homeDecorWhatsAppUrl, '_blank', 'noopener,noreferrer')}
                    >
                      RT HOME DECOR Support
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled>
                      RT HOME DECOR Support
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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

        {/* Dropdowns are now rendered inside their parent <li> elements above */}
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
                <span className="relative h-10 w-20 overflow-hidden block inline">
                  <Image
                    src="/brand/rt-logo.png"
                    alt="RTMETALCOATING"
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
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
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
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
                        href={categoryHref(cat)}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm transition-colors"
                        style={{ color: 'rgba(241,238,232,0.7)' }}
                      >
                        {getCategoryPath(cat, categories)}
                      </Link>
                    </li>
                  ))}
                </ul>

                {services.length > 0 && (
                  <>
                    <p
                      className="mb-3 mt-8 text-xs font-medium uppercase tracking-ultra"
                      style={{ color: 'rgba(241,238,232,0.4)' }}
                    >
                      Metal Services
                    </p>
                    <ul className="space-y-1">
                      {services.map((svc) => (
                        <li key={svc.slug}>
                          <Link
                            href={`/metal-coating/${svc.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block break-words rounded-lg px-3 py-3 text-sm transition-colors"
                            style={{ color: 'rgba(241,238,232,0.7)' }}
                          >
                            {svc.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {metalCategories.length > 0 && (
                  <Link
                    href="/metal-coating#collections"
                    onClick={() => setMobileOpen(false)}
                    className="mt-8 block break-words rounded-lg px-3 py-3 text-sm text-white/70"
                  >
                    View Metal Collections
                  </Link>
                )}
              </div>

              {/* Mobile drawer footer */}
              <div className="p-6" style={{ borderTop: `1px solid ${HDR.ddBorder}` }}>
                {navWhatsAppUrl ? (
                  <a
                    href={navWhatsAppUrl}
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
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
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
                        WhatsApp
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom">
                      {metalCoatingWhatsAppUrl ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setMobileOpen(false);
                            window.open(metalCoatingWhatsAppUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          Metal Coating Enquiry
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          Metal Coating Enquiry
                        </DropdownMenuItem>
                      )}
                      {homeDecorWhatsAppUrl ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setMobileOpen(false);
                            window.open(homeDecorWhatsAppUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          RT HOME DECOR Support
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          RT HOME DECOR Support
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
        /* Viewport-aware scrolling for the published services dropdown */
        .rt-services-scroll {
          max-height: calc(100vh - 7rem);
          max-height: calc(100dvh - 7rem);
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(201, 155, 76, 0.55) transparent;
        }
        .rt-services-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .rt-services-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .rt-services-scroll::-webkit-scrollbar-thumb {
          background: rgba(201, 155, 76, 0.45);
          border: 0;
          border-radius: 999px;
        }
        .rt-services-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(201, 155, 76, 0.7);
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
