'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from '@/components/sections/section-heading';
import { whatsappLink, EMAIL, PHONE_DISPLAY } from '@/lib/site';

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Get in touch"
          title="Let's start a conversation."
          description="Whether it is a product enquiry, a coating brief or a full project — tell us what you have in mind."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between gap-8 rounded-3xl bg-ink p-8 text-white sm:p-10">
              <div>
                <h3 className="font-display text-2xl font-semibold">
                  Contact details
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
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
                    <p className="text-xs uppercase tracking-wider text-foreground/50">
                      Studio
                    </p>
                    <p className="mt-1 text-sm">Studio 12, Design District, Mumbai, India</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-foreground/50">
                      Phone
                    </p>
                    <a
                      href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}
                      className="mt-1 block text-sm transition-colors hover:text-gold"
                    >
                      {PHONE_DISPLAY}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-foreground/50">
                      Email
                    </p>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="mt-1 block text-sm transition-colors hover:text-gold"
                    >
                      {EMAIL}
                    </a>
                  </div>
                </li>
              </ul>
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90"
              >
                <a
                  href={whatsappLink(
                    "Hello AURUM & CO., I'd like to discuss a project."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-border bg-background p-8 sm:p-10"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <Input placeholder="Your name" required />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <Input type="email" placeholder="you@email.com" required />
                </div>
              </div>
              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  I am interested in
                </label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full rounded-full sm:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitted ? 'Message sent — thank you' : 'Send Enquiry'}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
