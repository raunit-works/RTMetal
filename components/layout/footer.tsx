'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, MessageCircle, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { INSTAGRAM_URL, EMAIL, PHONE_DISPLAY, whatsappLink, isHomeDecorWhatsappVerified, isEmailVerified, isPhoneVerified, getBusinessAddress, getMetalCoatingWhatsAppLink } from '@/lib/site';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const footerLinks = {
  Collections: [
    { label: 'Home Decor', href: '/home-decor?category=home-decor' },
    { label: 'Decorative Accessories', href: '/home-decor?category=decorative-accessories' },
    { label: 'Gift Articles', href: '/home-decor?category=gift-articles' },
    { label: 'Lifestyle Products', href: '/home-decor?category=lifestyle-products' },
    { label: 'Household Products', href: '/home-decor?category=household-products' },
    { label: 'Daily Utility', href: '/home-decor?category=daily-utility' },
  ],
  Services: [
    { label: 'MS Coating', href: '/metal-coating#ms-coating' },
    { label: 'Brass Coating', href: '/metal-coating#brass-coating' },
    { label: 'Decorative Finishing', href: '/metal-coating#decorative-metal-finishing' },
    { label: 'Premium Surface Finishing', href: '/metal-coating#premium-surface-finishing' },
    { label: 'Custom Metal Coating', href: '/metal-coating#custom-metal-coating' },
    { label: 'Architectural Finishes', href: '/metal-coating#architectural-metal-finishes' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Our Process', href: '/#process' },
    { label: 'Testimonials', href: '/#testimonials' },
    { label: 'Contact', href: '/#contact' },
  ],
};

export function Footer() {
  const pathname = usePathname();
  const homeDecorWhatsAppUrl = whatsappLink('Hello RTMETALCOATING.');
  const metalCoatingWhatsAppUrl = getMetalCoatingWhatsAppLink(
    'Hello RTMETALCOATING, I would like to enquire about metal coating services.',
  );
  const footerWhatsAppUrl = pathname.startsWith('/metal-coating')
    ? metalCoatingWhatsAppUrl
    : homeDecorWhatsAppUrl;
  return (
    <footer className="relative overflow-hidden bg-ink text-white/80">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gold/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="relative h-12 w-36 overflow-hidden block">
                <Image
                  src="/brand/rt-logo.png"
                  alt="RTMETALCOATING"
                  fill
                  sizes="144px"
                  className="object-contain"
                />
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">
              A luxury house of home decor, lifestyle products and premium metal
              coating services. Crafted for architects, designers and
              discerning homeowners.
            </p>

            <div className="mt-10 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium uppercase tracking-ultra text-gold/90">
                  RTMETALCOATING
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  Professional Metal Coating &amp; Decorative Finishing Services
                  <br />
                  Mumbai, Maharashtra, India
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium uppercase tracking-ultra text-gold/90">
                  RT HOME DECOR
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  Online Home Decoration Store
                  <br />
                  Wai, Satara, Maharashtra, India
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all hover:border-gold hover:text-gold"
              >
                <Instagram className="h-5 w-5" />
              </a>
              {pathname.startsWith('/metal-coating') ? (
                footerWhatsAppUrl ? (
                  <a
                    href={footerWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all hover:border-gold hover:text-gold"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    disabled
                    aria-label="WhatsApp contact pending"
                    title="Business WhatsApp contact pending client approval"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/40 bg-white/5 cursor-not-allowed"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                )
              ) : pathname.startsWith('/home-decor') ? (
                footerWhatsAppUrl ? (
                  <a
                    href={footerWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all hover:border-gold hover:text-gold"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    disabled
                    aria-label="WhatsApp contact pending"
                    title="Business WhatsApp contact pending client approval"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/40 bg-white/5 cursor-not-allowed"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                )
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all hover:border-gold hover:text-gold"
                      aria-label="WhatsApp contact"
                    >
                      <MessageCircle className="h-5 w-5" />
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
              {isEmailVerified() ? (
                <a
                  href={`mailto:${EMAIL}`}
                  aria-label="Email"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all hover:border-gold hover:text-gold"
                >
                  <Mail className="h-5 w-5" />
                </a>
              ) : (
                <button
                  disabled
                  aria-label="Email contact pending"
                  title="Business email pending client approval"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/40 bg-white/5 cursor-not-allowed"
                >
                  <Mail className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-xs font-medium uppercase tracking-ultra text-gold/90">
                  {title}
                </p>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center text-sm text-white/70 transition-colors hover:text-gold"
                      >
                        {link.label}
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-gold" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-ultra text-gold/90">
              Get in touch
            </p>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gold shrink-0" />
                <span className="text-white/80">
                  {getBusinessAddress() || 'Business address pending client approval'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold shrink-0" />
                {isPhoneVerified() ? (
                  <a
                    href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}
                    className="text-white/80 transition-colors hover:text-gold"
                  >
                    {PHONE_DISPLAY}
                  </a>
                ) : (
                  <span className="text-white/40 cursor-not-allowed">
                    {PHONE_DISPLAY}
                  </span>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold shrink-0" />
                {isEmailVerified() ? (
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-white/80 transition-colors hover:text-gold"
                  >
                    {EMAIL}
                  </a>
                ) : (
                  <span className="text-white/40 cursor-not-allowed">
                    {EMAIL}
                  </span>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-8 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} RTMETALCOATING — All rights reserved.</p>
          <p className="flex items-center gap-4">
            <Link href="/" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <span className="h-3 w-px bg-white/20" />
            <Link href="/" className="transition-colors hover:text-white">
              Terms
            </Link>
            <span className="h-3 w-px bg-white/20" />
            <span>Designed as a premium concept</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
