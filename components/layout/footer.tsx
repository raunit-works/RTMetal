'use client';

import Link from 'next/link';
import { Instagram, MessageCircle, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { INSTAGRAM_URL, EMAIL, PHONE_DISPLAY, whatsappLink } from '@/lib/site';

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
    { label: 'About', href: '/#about' },
    { label: 'Our Process', href: '/#process' },
    { label: 'Testimonials', href: '/#testimonials' },
    { label: 'Contact', href: '/#contact' },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-foreground/70">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gold/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-sm font-semibold">
                A
              </span>
              <span className="font-display text-2xl font-semibold text-white">
                AURUM <span className="gold-text">&</span> CO.
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-foreground/60">
              A luxury house of home decor, lifestyle products and premium metal
              coating services. Crafted for architects, designers and
              discerning homeowners.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground/70 transition-all hover:border-gold hover:text-gold"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={whatsappLink('Hello AURUM & CO.')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground/70 transition-all hover:border-gold hover:text-gold"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={`mailto:${EMAIL}`}
                aria-label="Email"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground/70 transition-all hover:border-gold hover:text-gold"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-xs font-medium uppercase tracking-ultra text-foreground/40">
                  {title}
                </p>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center text-sm text-foreground/70 transition-colors hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-ultra text-foreground/40">
              Get in touch
            </p>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gold" />
                <span className="text-foreground/70">
                  Studio 12, Design District
                  <br />
                  Mumbai, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold" />
                <a
                  href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}
                  className="text-foreground/70 transition-colors hover:text-white"
                >
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold" />
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-foreground/70 transition-colors hover:text-white"
                >
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-8 text-xs text-foreground/40 sm:flex-row">
          <p>© {new Date().getFullYear()} AURUM & CO. — All rights reserved.</p>
          <p className="flex items-center gap-4">
            <Link href="/" className="transition-colors hover:text-foreground/70">
              Privacy
            </Link>
            <span className="h-3 w-px bg-white/10" />
            <Link href="/" className="transition-colors hover:text-foreground/70">
              Terms
            </Link>
            <span className="h-3 w-px bg-white/10" />
            <span>Designed as a premium concept</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
