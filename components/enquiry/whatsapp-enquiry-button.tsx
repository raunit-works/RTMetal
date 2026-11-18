'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getMetalCoatingWhatsAppContact,
  getWhatsAppContactOptions,
  type WhatsAppContact,
  type WhatsAppContactMode,
} from '@/lib/site';
import { cn } from '@/lib/utils';

export interface WhatsAppEnquiryButtonProps {
  mode: WhatsAppContactMode;
  message: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  showIcon?: boolean;
  iconClassName?: string;
  ariaLabel?: string;
  title?: string;
  chooserTitle?: string;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
}

function ContactOption({
  contact,
  onSelect,
}: {
  contact: WhatsAppContact;
  onSelect: () => void;
}) {
  return (
    <a
      href={contact.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onSelect}
      data-testid="whatsapp-contact-option"
      data-contact-id={contact.id}
      data-contact-number={contact.number}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:border-gold hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{contact.label}</span>
      <span className="shrink-0 text-xs font-normal text-muted-foreground">
        {contact.display}
      </span>
    </a>
  );
}

/**
 * Single public WhatsApp enquiry action.
 *
 * - Metal Services opens the one Metal WhatsApp contact directly.
 * - Home Decor always presents both supplied contacts so the customer chooses.
 * - General pages present a department/contact chooser.
 */
export function WhatsAppEnquiryButton({
  mode,
  message,
  label = 'WhatsApp',
  children,
  className,
  variant,
  size,
  showIcon = false,
  iconClassName,
  ariaLabel,
  title,
  chooserTitle,
  style,
  onMouseEnter,
  onMouseLeave,
}: WhatsAppEnquiryButtonProps) {
  const [open, setOpen] = React.useState(false);
  const contacts = React.useMemo(
    () => getWhatsAppContactOptions(mode, message),
    [mode, message],
  );
  const icon = (
    <MessageCircle
      className={cn(size === 'icon' ? 'h-4 w-4' : 'mr-2 h-4 w-4', iconClassName)}
      aria-hidden="true"
    />
  );
  const content =
    children ??
    (size === 'icon' ? (
      icon
    ) : (
      <>
        {showIcon && icon}
        {label}
      </>
    ));

  if (mode === 'metal_services') {
    const metalContact = getMetalCoatingWhatsAppContact(message);
    if (!metalContact) return null;

    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={className}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <a
          href={metalContact.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel ?? label}
          title={title}
          data-testid="whatsapp-direct-link"
          data-contact-number={metalContact.number}
        >
          {content}
        </a>
      </Button>
    );
  }

  if (contacts.length === 0) return null;

  const resolvedTitle =
    chooserTitle ??
    (mode === 'home_decor'
      ? 'Choose a Home Decor contact'
      : 'Choose a WhatsApp contact');

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        style={style}
        aria-label={ariaLabel ?? label}
        aria-haspopup="dialog"
        title={title}
        onClick={() => setOpen(true)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid="whatsapp-chooser-trigger"
      >
        {content}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          data-testid="whatsapp-chooser"
        >
          <DialogHeader>
            <DialogTitle>{resolvedTitle}</DialogTitle>
            <DialogDescription>
              Select the team you want to message on WhatsApp. Your enquiry
              details are prefilled, and you can review the message before
              sending it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2.5 py-1">
            {contacts.map((contact) => (
              <ContactOption
                key={contact.id}
                contact={contact}
                onSelect={() => setOpen(false)}
              />
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-full">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
