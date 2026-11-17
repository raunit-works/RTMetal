'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, MapPin, Phone, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { whatsappLink, EMAIL, PHONE_DISPLAY, isHomeDecorWhatsappVerified, isEmailVerified, isPhoneVerified, getMetalCoatingWhatsAppLink } from '@/lib/site';
import { createInquiry } from '@/lib/supabase/inquiries';
import {
  validateEnquiryIdentity,
  type EnquiryIdentityErrors,
} from '@/lib/enquiry/validation';

export function ContactSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<EnquiryIdentityErrors>({});
  const [interest, setInterest] = useState('Home Decor & Lifestyle Products');
  const [message, setMessage] = useState('');
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const homeDecorWhatsAppUrl = whatsappLink(
    "Hello RTMETALCOATING, I'd like to discuss a project.",
  );
  const metalCoatingWhatsAppUrl = getMetalCoatingWhatsAppLink(
    "Hello RTMETALCOATING, I'd like to enquire about metal coating services.",
  );
  const isMetalCoatingPage = pathname.startsWith('/metal-coating');
  const isHomeDecorPage = pathname.startsWith('/home-decor');
  const contactWhatsAppUrl = isMetalCoatingPage
    ? metalCoatingWhatsAppUrl
    : isHomeDecorPage
      ? homeDecorWhatsAppUrl
      : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productParam = params.get('product');
    const variantParam = params.get('variant');
    const productName = params.get('productName');
    const finish = params.get('finish');
    const sku = params.get('sku');

    if (!productParam && !variantParam) return;

    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (productParam && uuidPattern.test(productParam)) {
      setProductId(productParam);
    }
    if (variantParam && uuidPattern.test(variantParam)) {
      setVariantId(variantParam);
    }

    const details: string[] = [];
    if (productName) details.push(productName);
    if (finish) details.push(`Finish: ${finish}`);
    if (sku) details.push(`SKU: ${sku}`);

    if (details.length > 0) {
      setMessage(
        `Hello RTMETALCOATING, I am interested in ${details.join(' · ')}. Please share availability and a quotation.`
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const identity = validateEnquiryIdentity({ name, phone, email });
    setFieldErrors(identity.errors);
    setErrorMessage(null);
    if (!identity.isValid) return;

    setSubmitting(true);

    let division: 'home_decor' | 'metal_coating' = 'home_decor';
    let inquiry_type: 'general' | 'product' | 'service' = 'general';

    if (interest === 'Home Decor & Lifestyle Products') {
      division = 'home_decor';
      inquiry_type = 'product';
    } else if (interest === 'Metal Coating Services') {
      division = 'metal_coating';
      inquiry_type = 'service';
    } else if (interest === 'Custom / Bespoke Project') {
      division = 'metal_coating';
      inquiry_type = 'service';
    } else if (interest === 'Trade & Bulk Enquiry') {
      division = 'home_decor';
      inquiry_type = 'general';
    }

    const res = await createInquiry({
      name: identity.name,
      phone: identity.phone,
      email: identity.email,
      message,
      division,
      inquiry_type,
      ...(interest === 'Home Decor & Lifestyle Products' && productId
        ? { product_id: productId }
        : {}),
      ...(interest === 'Home Decor & Lifestyle Products' && variantId
        ? { variant_id: variantId }
        : {}),
    });

    setSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
      setFieldErrors({});
      setMessage('');
      setProductId(undefined);
      setVariantId(undefined);
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <section id="contact" className="pt-4 pb-4 sm:pt-6 sm:pb-6">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Get in touch"
          title="Let's start a conversation."
          description="Whether it is a product enquiry, a coating brief or a full project — tell us what you have in mind."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between gap-8 rounded-3xl bg-ink p-8 text-white sm:p-10">
              <div>
                <h3 className="font-display text-2xl font-medium text-white">
                  Contact details
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Prefer to reach out directly? We are here Monday to Saturday,
                  10am to 7pm.
                </p>
              </div>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold/90 font-medium">
                      Studio
                    </p>
                    <p className="mt-1 text-sm text-white/90">Studio 12, Design District, Mumbai, India</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold/90 font-medium">
                      Phone
                    </p>
                    {isPhoneVerified() ? (
                      <a
                        href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}
                        className="mt-1 block text-sm text-white/90 transition-colors hover:text-gold"
                      >
                        {PHONE_DISPLAY}
                      </a>
                    ) : (
                      <span className="mt-1 block text-sm text-white/40 cursor-not-allowed">
                        {PHONE_DISPLAY}
                      </span>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold/90 font-medium">
                      Email
                    </p>
                    {isEmailVerified() ? (
                      <a
                        href={`mailto:${EMAIL}`}
                        className="mt-1 block text-sm text-white/90 transition-colors hover:text-gold"
                      >
                        {EMAIL}
                      </a>
                    ) : (
                      <span className="mt-1 block text-sm text-white/40 cursor-not-allowed">
                        {EMAIL}
                      </span>
                    )}
                  </div>
                </li>
              </ul>
              {isMetalCoatingPage || isHomeDecorPage ? (
                contactWhatsAppUrl ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-full bg-[#25D366] text-ink hover:bg-[#25D366]/90"
                  >
                    <a
                      href={contactWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="lg"
                    className="w-full cursor-not-allowed rounded-full border border-[#25D366]/25 bg-[#25D366]/10 text-white/70 disabled:opacity-100"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat on WhatsApp
                  </Button>
                )
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full rounded-full bg-[#25D366] text-ink hover:bg-[#25D366]/90"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat on WhatsApp
                    </Button>
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
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-border bg-background p-8 sm:p-10"
            >
              {errorMessage && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {submitted && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Message sent successfully — thank you! We will reach out to you shortly.</span>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Name *
                  </label>
                  <Input
                    id="contact-name"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="contact-name-error" role="alert" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Mobile Number *
                  </label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'contact-phone-error' : undefined}
                  />
                  {fieldErrors.phone && (
                    <p id="contact-phone-error" role="alert" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Email (optional)
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="contact-email-error" role="alert" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  I am interested in
                </label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  disabled={submitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>Home Decor & Lifestyle Products</option>
                  <option>Metal Coating Services</option>
                  <option>Custom / Bespoke Project</option>
                  <option>Trade & Bulk Enquiry</option>
                </select>
              </div>
              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us about your project..."
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting || submitted}
                className="mt-6 w-full rounded-full sm:w-auto font-medium"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Enquiry...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {submitted ? 'Message sent — thank you' : 'Send Enquiry'}
                  </>
                )}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

