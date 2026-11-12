import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthBrandingProps {
  backHref: string;
  backLabel: string;
}

export function AuthBranding({ backHref, backLabel }: AuthBrandingProps) {
  return (
    <div>
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {backLabel}
      </Link>

      <div className="flex justify-center">
        <div className="flex h-24 w-60 items-center justify-center rounded-2xl bg-charcoal px-6 py-5 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)] ring-1 ring-gold/25 sm:h-28 sm:w-72">
          <div className="relative h-full w-full">
            <Image
              src="/brand/rt-logo.png"
              alt="RTMETALCOATING"
              fill
              priority
              sizes="(max-width: 640px) 192px, 240px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
