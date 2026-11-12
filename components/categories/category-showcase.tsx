'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/sections/section-heading';
import { resolveIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { CategoryShowcaseItem } from '@/lib/category-showcase';

interface CategoryShowcaseProps {
  items: CategoryShowcaseItem[];
  eyebrow: string;
  title: ReactNode;
  description: string;
  ctaLabel?: string;
  id?: string;
  className?: string;
}

const itemWidthClasses = {
  one: 'basis-full min-[390px]:basis-[84%] sm:basis-[calc((100%-1.25rem)/2)]',
  two: 'basis-full min-[390px]:basis-[84%] sm:basis-[calc((100%-1.25rem)/2)]',
  three:
    'basis-full min-[390px]:basis-[84%] sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]',
  many:
    'basis-full min-[390px]:basis-[84%] sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)] xl:basis-[calc((100%-3.75rem)/4)]',
} as const;

function getItemWidthClass(total: number) {
  if (total === 1) return itemWidthClasses.one;
  if (total === 2) return itemWidthClasses.two;
  if (total === 3) return itemWidthClasses.three;
  return itemWidthClasses.many;
}

export function CategoryShowcase({
  items,
  eyebrow,
  title,
  description,
  ctaLabel = 'Explore Collection',
  id,
  className,
}: CategoryShowcaseProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);
  const scrollFrame = useRef<number | null>(null);
  const layoutRef = useRef<{ starts: number[]; perView: number }>({
    starts: [0],
    perView: 1,
  });

  const [pageStarts, setPageStarts] = useState<number[]>([0]);
  const [activePage, setActivePage] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const syncActivePage = useCallback(() => {
    const scroller = scrollerRef.current;
    const starts = layoutRef.current.starts;
    if (!scroller || starts.length <= 1) {
      setActivePage(0);
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    let nearestPage = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    starts.forEach((start, pageIndex) => {
      const card = cardRefs.current[start];
      if (!card) return;

      const distance = Math.abs(
        card.getBoundingClientRect().left - scrollerRect.left
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = pageIndex;
      }
    });

    setActivePage((previous) =>
      previous === nearestPage ? previous : nearestPage
    );
  }, []);

  const updateLayout = useCallback(() => {
    const scroller = scrollerRef.current;
    const cards = cardRefs.current.filter(
      (card): card is HTMLLIElement => Boolean(card)
    );

    if (!scroller || cards.length === 0) return;

    const parent = cards[0].parentElement;
    const gap = parent
      ? Number.parseFloat(window.getComputedStyle(parent).columnGap) || 20
      : 20;
    const cardWidth = cards[0].getBoundingClientRect().width;

    if (!cardWidth) return;

    const perView = Math.max(
      1,
      Math.round((scroller.clientWidth + gap) / (cardWidth + gap))
    );
    const maxStart = Math.max(0, cards.length - perView);
    const starts: number[] = [];

    if (maxStart === 0) {
      starts.push(0);
    } else {
      for (let start = 0; start < cards.length; start += perView) {
        const clampedStart = Math.min(start, maxStart);
        if (!starts.includes(clampedStart)) starts.push(clampedStart);
        if (clampedStart === maxStart) break;
      }
    }

    layoutRef.current = { starts, perView };
    setPageStarts(starts);
    setIsScrollable(maxStart > 0);
    syncActivePage();
  }, [syncActivePage]);

  useEffect(() => {
    updateLayout();

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new ResizeObserver(updateLayout);
    observer.observe(scroller);

    return () => observer.disconnect();
  }, [items.length, updateLayout]);

  useEffect(
    () => () => {
      if (scrollFrame.current !== null) {
        window.cancelAnimationFrame(scrollFrame.current);
      }
    },
    []
  );

  const handleScroll = useCallback(() => {
    if (scrollFrame.current !== null) return;

    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = null;
      syncActivePage();
    });
  }, [syncActivePage]);

  const scrollToPage = useCallback((pageIndex: number) => {
    const scroller = scrollerRef.current;
    const starts = layoutRef.current.starts;
    if (!scroller || starts.length === 0) return;

    const targetPage = Math.max(0, Math.min(pageIndex, starts.length - 1));
    const targetCard = cardRefs.current[starts[targetPage]];
    if (!targetCard) return;

    const left =
      targetCard.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    setActivePage(targetPage);
    scroller.scrollTo({
      left,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToPage(activePage - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollToPage(activePage + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      scrollToPage(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      scrollToPage(pageStarts.length - 1);
    }
  };

  if (items.length === 0) return null;

  const itemWidthClass = getItemWidthClass(items.length);
  const currentPosition = Math.min(
    (pageStarts[activePage] ?? 0) + 1,
    items.length
  );

  return (
    <section
      id={id}
      className={cn('bg-ivory-soft py-16 sm:py-20 lg:py-24', className)}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div
          ref={scrollerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Category collections"
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="hide-scrollbar mt-10 snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory-soft sm:mt-12"
        >
          <ul
            className={cn(
              'flex gap-5',
              items.length === 1 && 'justify-center'
            )}
          >
            {items.map((item, index) => (
              <li
                key={item.id}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${items.length}: ${item.title}`}
                className={cn(
                  'group/slide shrink-0 snap-start',
                  itemWidthClass
                )}
              >
                <CategoryShowcaseCard item={item} ctaLabel={ctaLabel} />
              </li>
            ))}
          </ul>
        </div>

        {isScrollable && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p
              className="min-w-[4.5rem] font-label text-xs font-semibold tracking-[0.18em] text-ink-muted"
              aria-hidden="true"
            >
              {String(currentPosition).padStart(2, '0')} /{' '}
              {String(items.length).padStart(2, '0')}
            </p>

            <div className="order-3 flex w-full flex-wrap items-center justify-center gap-0.5 sm:order-none sm:w-auto">
              {pageStarts.map((start, pageIndex) => (
                <button
                  key={start}
                  type="button"
                  onClick={() => scrollToPage(pageIndex)}
                  aria-label={`Go to page ${pageIndex + 1} of ${
                    pageStarts.length
                  }`}
                  aria-current={
                    activePage === pageIndex ? 'true' : undefined
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none',
                      activePage === pageIndex
                        ? 'w-6 bg-gold-deep'
                        : 'w-1.5 bg-ink/20'
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => scrollToPage(activePage - 1)}
                disabled={activePage <= 0}
                aria-label="Previous categories"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white/70 text-ink transition-colors hover:border-gold/60 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollToPage(activePage + 1)}
                disabled={activePage >= pageStarts.length - 1}
                aria-label="Next categories"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white/70 text-ink transition-colors hover:border-gold/60 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="sr-only" aria-live="polite">
              Showing category {currentPosition} of {items.length}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryShowcaseCard({
  item,
  ctaLabel,
}: {
  item: CategoryShowcaseItem;
  ctaLabel: string;
}) {
  const Icon = resolveIcon(item.icon);
  const [imageFailed, setImageFailed] = useState(false);
  const image = item.image;
  const showImage = Boolean(image) && !imageFailed;

  return (
    <Link
      href={item.href}
      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#E7DFD1] bg-[#F8F3EA] shadow-[0_18px_45px_-34px_rgba(23,23,23,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_24px_55px_-32px_rgba(23,23,23,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory-soft motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EFE7DA]">
        {showImage && image ? (
          <Image
            src={image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover/slide:scale-105 motion-reduce:transition-none motion-reduce:group-hover/slide:scale-100"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F4EBDD] via-[#EDE2D1] to-[#E5D8C4]">
            <Icon
              className="h-14 w-14 text-gold-deep/60"
              aria-hidden="true"
            />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent"
          aria-hidden="true"
        />

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-ivory/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink shadow-sm backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5 text-gold-deep" aria-hidden="true" />
          Collection
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.7rem]">
            {item.title}
          </h3>
          <ArrowUpRight
            className="mt-1 h-5 w-5 shrink-0 text-gold-deep transition-transform duration-300 group-hover/slide:-translate-y-0.5 group-hover/slide:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/slide:translate-x-0 motion-reduce:group-hover/slide:translate-y-0"
            aria-hidden="true"
          />
        </div>

        {item.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}

        <span className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-brass px-5 text-sm font-semibold text-ink transition-colors group-hover/slide:bg-brass-light motion-reduce:transition-none sm:mt-6">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
