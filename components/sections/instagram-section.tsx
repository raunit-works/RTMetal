'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram, Volume2, VolumeX } from 'lucide-react';
import { INSTAGRAM_URL } from '@/lib/site';
import { SectionHeading } from '@/components/sections/section-heading';
import { cn } from '@/lib/utils';

const REELS = [
  '/videos/instagram/reel-01.mp4',
  '/videos/instagram/reel-02.mp4',
  '/videos/instagram/reel-03.mp4',
  '/videos/instagram/reel-04.mp4',
  '/videos/instagram/reel-05.mp4',
  '/videos/instagram/reel-06.mp4',
  '/videos/instagram/reel-07.mp4',
];

const CAPTIONS = [
  'Workshop Reel 01',
  'Workshop Reel 02',
  'Workshop Reel 03',
  'Workshop Reel 04',
  'Workshop Reel 05',
  'Workshop Reel 06',
  'Workshop Reel 07',
];

const AUTO_ADVANCE_MS = 5500;
const GAP = 16;
const DESKTOP_CARDS = 5;
const TABLET_CARDS = 3;
const MOBILE_CARDS = 2;
const MIN_CARD_W = 150;
const MAX_CARD_W = 210;

function ReelCard({
  src,
  caption,
  index,
  isActive,
  isMuted,
  cardW,
  onSelect,
  onToggleMute,
}: {
  src: string;
  caption: string;
  index: number;
  isActive: boolean;
  isMuted: boolean;
  cardW: number;
  onSelect: () => void;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {
        /* Autoplay may be blocked by the browser */
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  return (
    <div
      style={{ minWidth: cardW, width: cardW }}
      className="flex flex-col items-center"
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'relative aspect-[9/16] w-full rounded-xl border border-white/10 bg-[#0e0c0a] overflow-hidden snap-start transition-all duration-300',
          isActive ? 'ring-2 ring-[#c9a96e]/70' : ''
        )}
      >
        <video
          ref={videoRef}
          src={src}
          playsInline
          loop
          muted={isMuted}
          className="h-full w-full object-cover"
          preload="metadata"
          aria-label={`Reel ${index + 1}`}
        />
        {isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
      </button>
      <div className="mt-3 flex items-center gap-1 text-xs text-[#0e0c0a]">
        <Instagram className="h-3.5 w-3.5 text-[#c9a96e]" />
        <span className="font-medium">@rtmetalcoating</span>
      </div>
      <p className="mt-1 text-center text-sm text-[#37302a] leading-snug max-w-[180px]">
        {caption}
      </p>
    </div>
  );
}

export function InstagramSection({
  title = 'Craftsmanship in Every Detail',
  eyebrow = 'OUR WORK IN MOTION',
  description = 'Explore real projects, premium finishes and workshop craftsmanship through our latest videos.',
  posts,
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  posts?: any[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const lastInteractionRef = useRef<number>(0);

  const cardCount = windowWidth >= 1024 ? DESKTOP_CARDS : windowWidth >= 640 ? TABLET_CARDS : MOBILE_CARDS;
  const cardW =
    windowWidth > 0
      ? Math.min(MAX_CARD_W, Math.max(MIN_CARD_W, (windowWidth - GAP * (cardCount - 1)) / cardCount))
      : 170;

  useEffect(() => {
    const update = () => setWindowWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

      const scrollToIndex = useCallback(
    (index: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper || cardW <= 0) return;
      const step = cardW + GAP;
      isProgrammaticScrollRef.current = true;
      wrapper.scrollTo({ left: index * step, behavior: 'smooth' });
      setActiveIndex(index);
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);
    },
    [cardW]
  );

  const handleNext = useCallback(() => {
    lastInteractionRef.current = Date.now();
    const next = activeIndex + 1 >= REELS.length ? 0 : activeIndex + 1;
    scrollToIndex(next);
  }, [activeIndex, scrollToIndex]);

  const handlePrev = useCallback(() => {
    lastInteractionRef.current = Date.now();
    const prev = activeIndex - 1 < 0 ? REELS.length - 1 : activeIndex - 1;
    scrollToIndex(prev);
  }, [activeIndex, scrollToIndex]);

  const onScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current || cardW <= 0) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const step = cardW + GAP;
    const index = Math.round(wrapper.scrollLeft / step);
    const clamped = Math.max(0, Math.min(index, REELS.length - 1));
    setActiveIndex(clamped);
    lastInteractionRef.current = Date.now();
  }, [cardW]);

  const handleTouchStart = (e: React.TouchEvent) => setIsHovered(true);
  const handleTouchEnd = () => setIsHovered(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handlePrev, handleNext]);

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-advance
  useEffect(() => {
    if (reducedMotion) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const sinceInteraction = Date.now() - lastInteractionRef.current;
      if (!isVisible || tabHidden || isHovered || document.hidden || sinceInteraction < 4000) return;
      handleNext();
      lastInteractionRef.current = Date.now();
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, tabHidden, isHovered, handleNext, reducedMotion]);

  return (
    <section ref={sectionRef} className="py-6 sm:py-8 lg:py-10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
          className="mb-10"
        />

        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous reel"
            disabled={activeIndex === 0}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/90 text-[#0e0c0a] transition-all hover:bg-[#c9a96e] hover:text-[#0e0c0a] shadow-sm',
              activeIndex === 0 && 'opacity-40 pointer-events-none'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={wrapperRef}
            className="instagram-reel-scroll overflow-x-scroll overflow-y-hidden"
            onScroll={onScroll}
            tabIndex={0}
            aria-label="Instagram reels carousel"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div
              ref={trackRef}
              className="flex gap-16 scroll-snap-x snap-mandatory pb-4"
              style={{ width: cardW > 0 ? REELS.length * (cardW + GAP) - GAP : 'auto' }}
            >
              {REELS.map((src, i) => (
                <ReelCard
                  key={src}
                  src={src}
                  caption={CAPTIONS[i]}
                  index={i}
                  isActive={i === activeIndex && isVisible && !tabHidden}
                  isMuted={isMuted}
                  cardW={cardW > 0 ? cardW : 170}
                  onSelect={() => scrollToIndex(i)}
                  onToggleMute={() => setIsMuted((m) => !m)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next reel"
            disabled={activeIndex === REELS.length - 1}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/90 text-[#0e0c0a] transition-all hover:bg-[#c9a96e] hover:text-[#0e0c0a] shadow-sm',
              activeIndex === REELS.length - 1 && 'opacity-40 pointer-events-none'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#c9a96e] bg-transparent px-8 py-3 text-sm font-semibold text-[#c9a96e] transition-all duration-300 hover:bg-[#c9a96e] hover:text-[#0e0c0a]"
          >
            <Instagram className="h-4 w-4" />
            Follow Our Work on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
