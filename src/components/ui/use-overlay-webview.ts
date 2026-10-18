"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Only the top overlay may intercept Back; cleanup pops never close its parent. */
const activeOverlayStack: string[] = [];
let pendingCleanupPops = 0;
const ignoredPopEvents = new WeakSet<Event>();

/** Pure per-event consumption used by all mounted overlay listeners. */
export function consumeOverlayCleanupPop(event: Event): boolean {
  if (ignoredPopEvents.has(event)) return true;
  if (pendingCleanupPops <= 0) return false;
  pendingCleanupPops -= 1;
  ignoredPopEvents.add(event);
  return true;
}
export function queueOverlayCleanupPop(): void {
  pendingCleanupPops += 1;
}

/**
 * Host: dispatch cancelable "lms:native-back" before route navigation.
 * If dispatchEvent returns false the overlay consumed Back. History markers
 * also handle standard Android/browser Back; explicit close removes only its
 * own marker. Pending nondismissible overlays restore the marker.
 */
export function useOverlayWebview({
  open, dismissible, onDismiss, historyMode = "marker",
}: { open: boolean; dismissible: boolean; onDismiss: () => void; historyMode?: "marker" | "route" }) {
  const id = useId();
  const callback = useRef(onDismiss);
  callback.current = onDismiss;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  const [availableHeight, setAvailableHeight] = useState<string>();
  const [viewportTop, setViewportTop] = useState<string>();
  useEffect(() => {
    if (!open) return;
    const marker = `lms-overlay:${id}`;
    if (!activeOverlayStack.includes(marker)) activeOverlayStack.push(marker);
    const originalState = window.history.state as Record<string, unknown> | null;
    if (historyMode === "marker" && originalState?.lmsOverlay !== marker) {
      window.history.pushState({ ...(originalState ?? {}), lmsOverlay: marker }, "", window.location.href);
    }
    function hostBack(event: Event) {
      if (activeOverlayStack[activeOverlayStack.length - 1] !== marker) return;
      event.preventDefault();
      if (dismissibleRef.current) callback.current();
    }
    function popstate(event: PopStateEvent) {
      if (consumeOverlayCleanupPop(event)) return;
      if (historyMode === "route") return; // URL-selected detail: let browser history navigate naturally.
      if (activeOverlayStack[activeOverlayStack.length - 1] !== marker) return;
      if (dismissibleRef.current) callback.current();
      else {
        // Refuse navigation away from a pending, nondismissible action.
        window.history.pushState({ ...(window.history.state ?? {}), lmsOverlay: marker }, "", window.location.href);
      }
    }
    function resize() {
      const viewport = window.visualViewport;
      // Never impose a 240px minimum when a compact/keyboard viewport is smaller.
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      setAvailableHeight(`${Math.max(1,Math.floor(height))}px`);
      setViewportTop(`${Math.max(0,Math.floor(top))}px`);
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
      const index = activeOverlayStack.lastIndexOf(marker);
      if (index >= 0) activeOverlayStack.splice(index, 1);
      const latest = window.history.state as Record<string, unknown> | null;
      if (historyMode === "marker" && latest?.lmsOverlay === marker) {
        // The next popstate belongs to this explicit close, NOT to the parent.
        queueOverlayCleanupPop();
        window.history.back();
      }
    };
  }, [open, id, historyMode]);
  return { availableHeight, viewportTop };
}
