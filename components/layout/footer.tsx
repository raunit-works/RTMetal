
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Instagram,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

import {
  INSTAGRAM_URL,
  EMAIL,
  PHONE_DISPLAY,
  whatsappLink,
  isEmailVerified,
  isPhoneVerified,
  getBusinessAddress,
  getMetalCoatingWhatsAppLink,
} from '@/lib/site';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Exact Google Maps listing supplied for the Mumbai metalwork location.
const MAPS_URL =
  'https://maps.app.goo.gl/wtmGuotpv7b35y8W6';

// Embedded map using the coordinates of that Google Maps listing.
// If this legacy embed endpoint fails, replace it with the official
// iframe src from Google Maps > Share > Embed a map.
const MAP_EMBED_URL =
  'https://maps.google.com/maps?q=18.9586221%2C72.8261628&z=16&output=embed';

const footerLinks = {
  Collections: [
    {
      label: 'Home Decor',
      href: '/home-decor?category=home-decor',
    },
    {
      label: 'Decorative Accessories',
      href: '/home-decor?category=decorative-accessories',
    },
    {
      label: 'Gift Articles',
      href: '/home-decor?category=gift-articles',
    },
    {
      label: 'Lifestyle Products',
      href: '/home-decor?category=lifestyle-products',
    },
    {
      label: 'Household Products',
      href: '/home-decor?category=household-products',
    },
    {
      label: 'Daily Utility',
      href: '/home-decor?category=daily-utility',
    },
  ],
  Services: [
    {
      label: 'MS Coating',
      href: '/metal-coating#ms-coating',
    },
    {
      label: 'Brass Coating',
      href: '/metal-coating#brass-coating',
    },
    {
      label: 'Decorative Finishing',
      href: '/metal-coating#decorative-metal-finishing',
    },
    {
      label: 'Premium Surface Finishing',
      href: '/metal-coating#premium-surface-finishing',
    },
    {
      label: 'Custom Metal Coating',
      href: '/metal-coating#custom-metal-coating',
    },
    {
      label: 'Architectural Finishes',
      href: '/metal-coating#architectural-metal-finishes',
    },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Before & After', href: '/before-after' },
    { label: 'Our Process', href: '/#process' },
    { label: 'Testimonials', href: '/#testimonials' },
    { label: 'Contact', href: '/#contact' },
  ],
};

const socialClass =
  'flex h-11 w-11 items-center justify-center rounded-full ' +
  'border border-white/15 text-white/80 transition-colors ' +
  'hover:border-gold hover:text-gold ' +
  'focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-gold';

const disabledSocialClass =
  'flex h-11 w-11 items-center justify-center rounded-full ' +
  'border border-white/15 bg-white/5 text-white/40 ' +
  'cursor-not-allowed';


function FooterLocationMap() {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/15 bg-white/[0.04]">
      <div className="px-3 py-2.5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          Metal Coating Location
        </p>

        <h3 className="mt-1 text-sm font-medium text-white">
          Find Us in Mumbai
        </h3>

        <p className="mt-0.5 text-xs leading-relaxed text-white/60">
          Kumbharwada, Mumbai 400004
        </p>
      </div>

      <div className="overflow-hidden border-y border-white/10 bg-[#242424]">
        <iframe
          title="RT Metal Coating location in Mumbai"
          src={MAP_EMBED_URL}
          className="block h-[165px] w-full border-0 lg:h-[140px]"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-gold" />
          View on Google Maps
        </span>

        <ExternalLink
          className="h-4 w-4 shrink-0 text-gold"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}


export function Footer() {
  const pathname = usePathname();

  const isMetalPage = pathname.startsWith('/metal-coating');
  const isHomeDecorPage = pathname.startsWith('/home-decor');

  const homeDecorWhatsAppUrl = whatsappLink(
    'Hello RTMETALCOATING.'
  );

  const metalCoatingWhatsAppUrl =
    getMetalCoatingWhatsAppLink(
      'Hello RTMETALCOATING, I would like to enquire about metal coating services.'
    );

  const footerWhatsAppUrl = isMetalPage
    ? metalCoatingWhatsAppUrl
    : homeDecorWhatsAppUrl;

  return (
    <footer className="relative overflow-hidden bg-ink text-white/80">
      {/* Restrained background accents */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gold/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-7 border-b border-white/10 py-8 lg:grid-cols-12 lg:gap-x-8 lg:py-10">

          {/* LEFT — BRAND AND BUSINESS DIVISIONS */}
          <div className="min-w-0 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="RTMETALCOATING homepage"
            >
              <span className="relative block h-12 w-36 overflow-hidden">
                <Image
                  src="/brand/rt-logo.png"
                  alt="RTMETALCOATING"
                  fill
                  sizes="144px"
                  className="object-contain"
                />
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              Metal coating, surface finishing and decorative products
              for residential, commercial and architectural projects.
            </p>

            {/* Business identities */}
            <div className="mt-7 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
                  RTMETALCOATING
                </p>

                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  Metal Coating &amp; Decorative Finishing Services
                  <span className="mt-1 block text-white/55">
                    Mumbai, Maharashtra, India
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
                  RT HOME DECOR
                </p>

                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  Online Home Decoration Store
                  <span className="mt-1 block text-white/55">
                    Wai, Satara, Maharashtra, India
                  </span>
                </p>
              </div>
            </div>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={socialClass}
              >
                <Instagram className="h-5 w-5" />
              </a>

              {isMetalPage || isHomeDecorPage ? (
                footerWhatsAppUrl ? (
                  <a
                    href={footerWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className={socialClass}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="WhatsApp contact pending"
                    title="WhatsApp contact pending client approval"
                    className={disabledSocialClass}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                )
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={socialClass}
                      aria-label="Choose WhatsApp contact"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent side="top" align="start">
                    <DropdownMenuItem
                      disabled={!metalCoatingWhatsAppUrl}
                      onClick={() => {
                        if (metalCoatingWhatsAppUrl) {
                          window.open(
                            metalCoatingWhatsAppUrl,
                            '_blank',
                            'noopener,noreferrer'
                          );
                        }
                      }}
                    >
                      Metal Coating Enquiry
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      disabled={!homeDecorWhatsAppUrl}
                      onClick={() => {
                        if (homeDecorWhatsAppUrl) {
                          window.open(
                            homeDecorWhatsAppUrl,
                            '_blank',
                            'noopener,noreferrer'
                          );
                        }
                      }}
                    >
                      RT HOME DECOR Support
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isEmailVerified() ? (
                <a
                  href={`mailto:${EMAIL}`}
                  aria-label="Email"
                  className={socialClass}
                >
                  <Mail className="h-5 w-5" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-label="Email contact pending"
                  title="Business email pending client approval"
                  className={disabledSocialClass}
                >
                  <Mail className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — NAVIGATION, CONTACT AND LOCATION */}

          {/* RIGHT — NAVIGATION, CONTACT AND LOCATION */}
          <div className="min-w-0 lg:col-span-8">
            <div className="grid gap-7 lg:grid-cols-8 lg:gap-x-6">

              {/* Navigation columns */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:col-span-5">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title} className="min-w-0">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.17em] text-gold">
                      {title}
                    </h3>

                    <ul className="mt-3 space-y-2.5">
                      {links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="group inline-flex items-start gap-1 text-sm leading-relaxed text-white/70 transition-colors hover:text-white"
                          >
                            <span>{link.label}</span>

                            <ArrowUpRight
                              className="mt-0.5 h-3 w-3 shrink-0 text-gold opacity-0 transition-opacity group-hover:opacity-100"
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Contact and Google Map */}
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1 lg:content-start">

                {/* Contact details */}
                <div className="min-w-0">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.17em] text-gold">
                    Get in Touch
                  </h3>

                  <ul className="mt-3 space-y-3 text-sm">

                    <li className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span className="min-w-0 break-words leading-relaxed text-white/70">
                        {getBusinessAddress() ||
                          'Business address pending client approval'}
                      </span>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />

                      {isPhoneVerified() ? (
                        <a
                          href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}
                          className="min-w-0 break-words text-white/70 transition-colors hover:text-gold"
                        >
                          {PHONE_DISPLAY}
                        </a>
                      ) : (
                        <span className="min-w-0 break-words text-white/40">
                          {PHONE_DISPLAY}
                        </span>
                      )}
                    </li>

                    <li className="flex items-start gap-2.5">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />

                      {isEmailVerified() ? (
                        <a
                          href={`mailto:${EMAIL}`}
                          className="min-w-0 break-all text-white/70 transition-colors hover:text-gold"
                        >
                          {EMAIL}
                        </a>
                      ) : (
                        <span className="min-w-0 break-all text-white/40">
                          {EMAIL}
                        </span>
                      )}
                    </li>

                  </ul>
                </div>

                {/* Map stays beside or below contact based on screen width */}
                <FooterLocationMap />

              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT BAR */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 text-center text-xs text-white/50 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} RTMETALCOATING.
            All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            <Link
              href="/"
              className="transition-colors hover:text-white"
            >
              Privacy
            </Link>

            <span className="h-3 w-px bg-white/20" />

            <Link
              href="/"
              className="transition-colors hover:text-white"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
