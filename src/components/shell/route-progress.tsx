"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import "./route-progress.css";

/**
 * Minimal route intent indicator for slow App Router transitions.
 * Legacy sources specify the fullscreen .ln-page-loader, but no thin progress
 * strip. This is a vNext accessibility adaptation; do not claim pixel parity
 * with a nonexistent measured legacy bar.
 *
 * Page chrome remains mounted and this control never blocks navigation.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      setPending(false);
    };
    // A committed pathname means the destination is ready.
    clearPending();
    const beginPending = () => {
      setPending(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      // If client navigation rejects without a pathname update, recover.
      timer.current = window.setTimeout(clearPending, 8000);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) ||
          (anchor.target && anchor.target !== "_self") ||
          anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return;
      let destination: URL;
      try { destination = new URL(anchor.href, window.location.href); }
      catch { return; }
      if (destination.origin !== window.location.origin ||
          destination.pathname === pathname) return;
      beginPending();
    };
    const onPopState = () => beginPending();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", clearPending);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", clearPending);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [pathname]);

  return pending ? (
    <div data-slot="route-progress" className="lms-route-progress" role="progressbar"
      aria-label="Opening page" aria-valuemin={0} aria-valuemax={100}>
      <span aria-hidden="true" className="lms-route-progress-segment" />
    </div>
  ) : null;
}
