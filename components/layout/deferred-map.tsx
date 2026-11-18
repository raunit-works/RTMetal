'use client';

import * as React from 'react';

/**
 * Mounts the Google Maps iframe only when the map is close to the viewport.
 *
 * The embed ships a large third-party script bundle. Deferring it keeps that
 * cost off the initial page load while preserving the map for anyone who
 * scrolls to the footer.
 */
export function DeferredMap({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || shouldLoad) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className={className}>
      {shouldLoad ? (
        <iframe
          title={title}
          src={src}
          className="block h-full w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-[#1b1b1b]"
          aria-hidden="true"
        >
          <span className="h-2 w-2 rounded-full bg-gold/50" />
        </div>
      )}
    </div>
  );
}
