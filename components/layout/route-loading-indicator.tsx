"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function toLocationKey(pathname: string, search: string) {
  const normalizedSearch = search.startsWith("?") || search === "" ? search : `?${search}`;
  return `${pathname}${normalizedSearch}`;
}

function isMeaningfulNavigation(nextUrl: URL) {
  if (typeof window === "undefined") return false;
  const current = toLocationKey(window.location.pathname, window.location.search);
  const next = toLocationKey(nextUrl.pathname, nextUrl.search);
  if (next !== current) return true;
  // Hash-only changes do not represent page-level loading.
  return false;
}

function getInternalNavigationUrl(anchor: HTMLAnchorElement) {
  const target = anchor.getAttribute("target");
  if (target && target.toLowerCase() !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;
  return url;
}

function resolveUrl(input?: string | URL | null) {
  if (typeof window === "undefined") return null;
  try {
    if (input instanceof URL) return new URL(input.toString(), window.location.href);
    if (typeof input === "string") return new URL(input, window.location.href);
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

function RouteLoadingIndicatorInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const hideTimerRef = React.useRef<number | null>(null);
  const failsafeTimerRef = React.useRef<number | null>(null);
  const verifyTimerRef = React.useRef<number | null>(null);
  const pendingCountRef = React.useRef(0);
  const lastLocationKeyRef = React.useRef<string>("");
  const renderedKeyRef = React.useRef<string>("");

  // Track the route that has actually rendered so deferred history callbacks can
  // tell a committed navigation from a bare URL update.
  renderedKeyRef.current = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  const clearTimers = React.useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (failsafeTimerRef.current) window.clearTimeout(failsafeTimerRef.current);
    if (verifyTimerRef.current) window.clearTimeout(verifyTimerRef.current);
    hideTimerRef.current = null;
    failsafeTimerRef.current = null;
    verifyTimerRef.current = null;
  }, []);

  const armFailsafe = React.useCallback(() => {
    if (failsafeTimerRef.current) window.clearTimeout(failsafeTimerRef.current);
    failsafeTimerRef.current = window.setTimeout(() => {
      pendingCountRef.current = 0;
      setLoading(false);
      failsafeTimerRef.current = null;
    }, 10000);
  }, []);

  const begin = React.useCallback(
    (reason?: string) => {
      if (typeof window === "undefined") return;
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      pendingCountRef.current += 1;
      setLoading(true);
      armFailsafe();
      void reason;
    },
    [armFailsafe]
  );

  const finish = React.useCallback(
    (opts?: { force?: boolean }) => {
      if (opts?.force) pendingCountRef.current = 0;
      else pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);

      if (pendingCountRef.current > 0) {
        armFailsafe();
        return;
      }

      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setLoading(false);
        if (failsafeTimerRef.current) {
          window.clearTimeout(failsafeTimerRef.current);
          failsafeTimerRef.current = null;
        }
        hideTimerRef.current = null;
      }, 150);
    },
    [armFailsafe]
  );

  React.useEffect(() => {
    const key = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (lastLocationKeyRef.current && lastLocationKeyRef.current !== key) {
      // Route/search params committed: clear any pending navigation state.
      pendingCountRef.current = 0;
      finish({ force: true });
    } else if (!lastLocationKeyRef.current) {
      lastLocationKeyRef.current = key;
    }
    lastLocationKeyRef.current = key;
  }, [pathname, searchParams, finish]);

  // Raw History API writes (outside the Next router) change the address bar but
  // never commit a route, so without this they would leave the indicator stuck
  // until the failsafe. If the URL and the rendered route still disagree after
  // a short window, treat it as a non-navigational URL update and clear it.
  // Any pending state is also capped so a cancelled/aborted navigation cannot
  // leave the indicator spinning indefinitely.
  const queueCommitVerification = React.useCallback(() => {
    if (verifyTimerRef.current) window.clearTimeout(verifyTimerRef.current);
    verifyTimerRef.current = window.setTimeout(() => {
      verifyTimerRef.current = null;
      pendingCountRef.current = 0;
      finish({ force: true });
    }, 2500);
  }, [finish]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const onHistoryChange = (url?: string | URL | null) => {
      const nextUrl = resolveUrl(url);
      if (!nextUrl) return;
      if (nextUrl.origin !== window.location.origin) return;
      if (!isMeaningfulNavigation(nextUrl)) return;
      // History writes can happen inside React insertion effects (Next's
      // HistoryUpdater). Scheduling the state update keeps those effects pure
      // and avoids "useInsertionEffect must not schedule updates" warnings.
      window.setTimeout(() => {
        // If the route already rendered (React committed the new pathname),
        // there is nothing left to indicate.
        const committedKey = toLocationKey(window.location.pathname, window.location.search);
        if (committedKey === renderedKeyRef.current) return;
        begin("history");
        queueCommitVerification();
      }, 0);
    };

    window.history.pushState = function patchedPushState(
      this: History,
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      onHistoryChange(url ?? null);
      return originalPushState.call(this, data, unused, url as any);
    } as History["pushState"];

    window.history.replaceState = function patchedReplaceState(
      this: History,
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      // replaceState is used for non-navigational URL updates in some flows;
      // only show loader when path/search actually changes.
      onHistoryChange(url ?? null);
      return originalReplaceState.call(this, data, unused, url as any);
    } as History["replaceState"];

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const url = getInternalNavigationUrl(anchor);
      if (!url || !isMeaningfulNavigation(url)) return;

      // Start in the user event itself so the indicator reflects the
      // navigation immediately; commit/failsafe clears it. This also avoids
      // scheduling from React insertion effects.
      begin("click");
    };

    const onPopState = () => {
      // Actual destination resolved after event; show briefly and rely on
      // location commit/failsafe to clear if cancelled/no-op.
      begin("popstate");
      queueCommitVerification();
    };

    const onPageHide = () => {
      pendingCountRef.current = 0;
      clearTimers();
      setLoading(false);
    };

    const onPageShow = () => {
      // Back/forward cache restores can leave stale pending state.
      pendingCountRef.current = 0;
      clearTimers();
      setLoading(false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // If navigation is cancelled/fails while backgrounded, avoid a stuck indicator.
        window.setTimeout(() => {
          const key = toLocationKey(window.location.pathname, window.location.search);
          if (key === lastLocationKeyRef.current) {
            pendingCountRef.current = 0;
            clearTimers();
            setLoading(false);
          }
        }, 1200);
      }
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      pendingCountRef.current = 0;
      clearTimers();
    };
  }, [armFailsafe, begin, clearTimers, queueCommitVerification]);

  return (
    <div
      aria-hidden="true"
      data-testid="route-loading-indicator"
      data-loading={loading ? "true" : "false"}
      className={`pointer-events-none fixed left-4 top-4 z-[80] transition-opacity duration-200 ${
        loading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-white/90 shadow-lg backdrop-blur-md">
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/40" />
          <span className="relative inline-flex h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold-deep" />
        </span>
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export function RouteLoadingIndicator() {
  return (
    <React.Suspense fallback={null}>
      <RouteLoadingIndicatorInner />
    </React.Suspense>
  );
}
