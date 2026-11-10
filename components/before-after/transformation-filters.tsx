import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BeforeAfterServiceRef } from '@/lib/types';

export function TransformationFilters({
  services,
  activeServiceSlug,
  total,
}: {
  services: BeforeAfterServiceRef[];
  activeServiceSlug?: string;
  total: number;
}) {
  if (services.length === 0 && !activeServiceSlug) {
    return (
      <p className="text-xs text-[#8F8D87]">
        All published transformations
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8F8D87]">
        <SlidersHorizontal className="h-3.5 w-3.5 text-[#D8A548]" aria-hidden="true" />
        Filter by service
        <span className="ml-auto normal-case tracking-normal text-[#8F8D87]">
          {total} published
        </span>
      </div>

      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link
          href="/before-after"
          aria-current={!activeServiceSlug ? 'page' : undefined}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors',
            !activeServiceSlug
              ? 'border-[#d8a548] bg-[#d8a548] text-[#191713]'
              : 'border-white/12 bg-white/[0.03] text-[#C5C4C1] hover:border-[#d8a548]/50 hover:text-[#F2D18B]'
          )}
        >
          All Transformations
        </Link>

        {services.map((service) => {
          const active = activeServiceSlug === service.slug;
          return (
            <Link
              key={service.id}
              href={`/before-after?service=${encodeURIComponent(service.slug)}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors',
                active
                  ? 'border-[#d8a548] bg-[#d8a548] text-[#191713]'
                  : 'border-white/12 bg-white/[0.03] text-[#C5C4C1] hover:border-[#d8a548]/50 hover:text-[#F2D18B]'
              )}
            >
              {service.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
