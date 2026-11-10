'use client';

import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createInquiry } from '@/lib/supabase/inquiries';
import { getMetalCoatingWhatsAppLink } from '@/lib/site';

export function TransformationEnquiry({
  projectTitle,
  serviceId,
  serviceName,
}: {
  projectTitle?: string;
  serviceId?: string;
  serviceName?: string;
}) {
  const defaultMessage = projectTitle
    ? `I'm interested in a similar metal finishing project like "${projectTitle}". Please share a quotation and the next steps.`
    : "I'm interested in a metal finishing project. Please share a quotation and the next steps.";

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState(defaultMessage);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const whatsappUrl = getMetalCoatingWhatsAppLink(
    projectTitle
      ? `Hello RTMETALCOATING, I'd like to enquire about a project similar to "${projectTitle}".`
      : "Hello RTMETALCOATING, I'd like to enquire about a metal finishing project."
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await createInquiry({
      name,
      email,
      phone: phone.trim() || undefined,
      message,
      inquiry_type: 'service',
      division: 'metal_coating',
      service_id: serviceId,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage(defaultMessage);
    } else {
      setError(result.message);
    }
  };

  return (
    <section
      id="project-enquiry"
      aria-labelledby="project-enquiry-heading"
      className="relative overflow-hidden rounded-3xl border border-[#d8a548]/25 bg-[#17181a] p-6 sm:p-9 lg:p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#d8a548]/10 blur-[90px]"
      />

      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D8A548]">
            Start a Project
          </p>
          <h2
            id="project-enquiry-heading"
            className="mt-3 font-display text-3xl font-normal leading-tight tracking-[-0.02em] text-[#F7F4EF] sm:text-4xl"
          >
            Request a quotation for a similar finish.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C5C4C1]">
            All projects are quotation-based. Share the component, material and
            the finish you have in mind{serviceName ? `, including ${serviceName}` : ''}.
            Our team will review the requirements and respond with the next steps.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Button
            type="button"
            onClick={() => {
              setOpen((current) => !current);
              setSubmitted(false);
              setError(null);
            }}
            className="min-h-11 rounded-full bg-[#D8A548] px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#191713] hover:bg-[#C39337]"
          >
            {open ? 'Hide Enquiry Form' : 'Request a Quote'}
          </Button>

          {whatsappUrl && (
            <Button
              asChild
              variant="outline"
              className="min-h-11 rounded-full border-[#25D366]/40 bg-transparent px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#7BE2A4] hover:bg-[#25D366]/10 hover:text-[#A4F0C3]"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="relative mt-8 border-t border-white/10 pt-7">
          {submitted ? (
            <div
              role="status"
              className="flex flex-col items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-10 text-center"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />
              <h3 className="mt-3 font-display text-2xl text-[#F7F4EF]">
                Enquiry received.
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#C5C4C1]">
                Thank you. We have received your project enquiry and will review
                the details before responding.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D8A548] hover:text-[#F2D18B]"
              >
                Send another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project-enquiry-name" className="text-[#E8E6E1]">
                  Name
                </Label>
                <Input
                  id="project-enquiry-name"
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  className="border-white/15 bg-white/[0.04] text-[#F7F4EF] placeholder:text-[#77756F]"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="project-enquiry-email" className="text-[#E8E6E1]">
                  Email
                </Label>
                <Input
                  id="project-enquiry-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
                  maxLength={255}
                  autoComplete="email"
                  className="border-white/15 bg-white/[0.04] text-[#F7F4EF] placeholder:text-[#77756F]"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="project-enquiry-phone" className="text-[#E8E6E1]">
                  Phone <span className="text-[#8F8D87]">(optional)</span>
                </Label>
                <Input
                  id="project-enquiry-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.currentTarget.value)}
                  maxLength={20}
                  autoComplete="tel"
                  className="border-white/15 bg-white/[0.04] text-[#F7F4EF] placeholder:text-[#77756F]"
                  placeholder="+91"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="project-enquiry-message" className="text-[#E8E6E1]">
                  Project details
                </Label>
                <Textarea
                  id="project-enquiry-message"
                  value={message}
                  onChange={(event) => setMessage(event.currentTarget.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  className="border-white/15 bg-white/[0.04] text-[#F7F4EF] placeholder:text-[#77756F]"
                  placeholder="Tell us about the component, material, quantity and finish."
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 text-xs text-[#E09A8F] sm:col-span-2"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 rounded-full bg-[#D8A548] px-7 text-xs font-bold uppercase tracking-[0.08em] text-[#191713] hover:bg-[#C39337]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending Enquiry
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                      Send Enquiry
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
