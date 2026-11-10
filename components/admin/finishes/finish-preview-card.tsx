import Image from 'next/image';
import { ArrowRight, Bookmark, Square } from 'lucide-react';
import type { MetalFinish } from '@/lib/types';

/**
 * Read-only visual preview of the public finish card. Interactive compare,
 * bookmark and enquiry actions are intentionally inert here.
 */
export function FinishPreviewCard({ finish }: { finish: MetalFinish }) {
  return (
    <article
      className="
        group flex h-full min-w-0 flex-col
        overflow-hidden rounded-2xl
        border border-[#e4ddd3]
        bg-[#faf8f4]
        shadow-[0_6px_22px_rgba(42,32,20,0.07)]
      "
    >
      <div className="relative aspect-[1.55/1] overflow-hidden bg-[#e3dfd8] sm:aspect-[16/10]">
        {finish.mainImageUrl ? (
          <Image
            src={finish.mainImageUrl}
            alt={`${finish.finishCode} ${finish.name} metal finish sample`}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-contain p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#756b60]">
            No main image
          </div>
        )}

        <span className="absolute left-3 top-3 z-10 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-black/60 px-2.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <Square className="h-3.5 w-3.5" />
          Compare
        </span>
        <span className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-sm">
          <Bookmark className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-[19px] font-medium leading-[1.2] tracking-tight text-[#201b15] sm:text-[21px]">
            {finish.name}
          </h3>
          <span className="shrink-0 rounded-md bg-[#eae5dd] px-2 py-1 text-[10px] font-medium text-[#62594c]">
            {finish.finishCode}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-[#e6ded2] pb-2 text-[12px]">
          <span className="font-semibold text-[#25201a]">Appearance</span>
          <span className="text-[#a58a60]">|</span>
          <span className="text-[#665f56]">{finish.appearance}</span>
        </div>

        <div className="mt-2 text-[12px] leading-[1.5] text-[#625b52]">
          <span className="font-semibold text-[#25201a]">Applications</span>
          <span className="mx-2 text-[#a58a60]">|</span>
          {finish.applications}
        </div>

        <div className="mt-auto pt-4">
          <span className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-[#c5a16a] px-3 py-2 text-center text-[12px] font-medium text-[#765020]">
            Enquire about this finish
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </span>
        </div>
      </div>
    </article>
  );
}
