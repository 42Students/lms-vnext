"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import "./route-progress.css";

/** Original LMS has no top progress strip. Its .ln-page-loader
 * (common.scss:1008-1019) is the historical full-screen slow route visual.
 * No modern indeterminate 3px bar is painted.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [stalled, setStalled] = useState(false);
  const recovery = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reveal = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stall = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      for (const value of [recovery, reveal, stall]) {
        if (value.current !== null) window.clearTimeout(value.current);
        value.current = null;
      }
    };
    const clearPending = () => {
      clearTimers();
      setPending(false);
      setSlow(false);
      setStalled(false);
    };
    // A committed pathname means the destination is ready.
    clearPending();
    const beginPending = () => {
      clearTimers();
      setPending(true);
      setSlow(false);
      setStalled(false);
      reveal.current = window.setTimeout(() => setSlow(true), 700);
      stall.current = window.setTimeout(() => setStalled(true), 20_000);
      // Always recover if the route is rejected without a commit.
      recovery.current = window.setTimeout(clearPending, 30_000);
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
    // Back/forward within the same pathname only changes search/hash state.
    // Next's pathname hook does not rerun for that navigation, so starting a
    // timer here would leave the full-screen slow loader up for 30 seconds.
    const onPopState = () => {
      if (window.location.pathname === pathname) {
        clearPending();
        return;
      }
      beginPending();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", clearPending);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", clearPending);
      clearTimers();
    };
  }, [pathname]);

  // No legacy top strip: the historic full-screen loader is the only
  // route-intent visual, and only appears for a slow navigation.
  if (!pending || !slow) return null;
  return <div data-slot="legacy-page-loader" className="lms-legacy-page-loader" role="status"
      aria-label="Loading page">
      <div className="lms-legacy-loader-spin">
        <span className="lms-legacy-loader-dots" aria-hidden="true">
          <i/><i/><i/><i/>
        </span>
        {stalled ? <div className="lms-legacy-loader-recovery">
          <p>Still loading…</p>
          <Button type="button" variant="secondary" onClick={()=>window.location.reload()}>Reload</Button>
        </div> : null}
      </div>
    </div>;
}
