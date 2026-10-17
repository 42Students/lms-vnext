"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Native host contract:
 * Before host Back navigates, dispatch a cancelable "lms:native-back" event on window.
 * If dispatchEvent returns false, the web view owns that back press. Do not navigate.
 * Browser history gets a same-URL marker so Android WebView's regular Back closes
 * the frontmost modal before leaving the route. Never prevent a pending write from
 * finishing by releasing the marker automatically.
 */
export function useOverlayWebview({
  open, dismissible, onDismiss,
}: { open: boolean; dismissible: boolean; onDismiss: () => void }) {
  const id = useId();
  const callback = useRef(onDismiss);
  callback.current = onDismiss;
  const [availableHeight, setAvailableHeight] = useState<string>();
  useEffect(() => {
    if (!open) { setAvailableHeight(undefined); return; }
    const marker = `lms-overlay:${id}`;
    const current = window.history.state as Record<string, unknown> | null;
    if (current?.lmsOverlay !== marker) {
      window.history.pushState({ ...(current ?? {}), lmsOverlay: marker }, "", window.location.href);
    }
    function hostBack(event: Event) {
      event.preventDefault();
      if (dismissible) callback.current();
    }
    function popstate() {
      if (dismissible) callback.current();
      else window.history.pushState({ ...(window.history.state ?? {}), lmsOverlay: marker }, "", window.location.href);
    }
    function resize() {
      const viewport = window.visualViewport;
      const height = viewport ? Math.max(240, viewport.height) : window.innerHeight;
      setAvailableHeight(`${Math.floor(height)}px`);
    }
    resize();
    window.addEventListener("lms:native-back", hostBack);
    window.addEventListener("popstate", popstate);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      window.removeEventListener("lms:native-back", hostBack);
      window.removeEventListener("popstate", popstate);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      const latest = window.history.state as Record<string, unknown> | null;
      if (latest?.lmsOverlay === marker) window.history.back();
    };
  }, [open, dismissible, id]);
  return { availableHeight };
}
