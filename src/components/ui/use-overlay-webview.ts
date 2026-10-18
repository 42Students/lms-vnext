"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Marker-specific Back ownership; no global pending-pop counter. */
const activeOverlayStack: string[] = [];

export function ownsOverlayHistoryEntry(state: unknown, marker: string): boolean {
  return typeof state === "object" && state !== null &&
    (state as { lmsOverlay?: unknown }).lmsOverlay === marker;
}

/** Native hosts dispatch cancelable lms:native-back before navigating. */
export function useOverlayWebview({
  open, dismissible, onDismiss, historyMode = "marker",
}: { open: boolean; dismissible: boolean; onDismiss: () => void; historyMode?: "marker" | "route" }) {
  const id = useId();
  const generation = useRef(0);
  const markerRef = useRef<string | null>(null);
  const previouslyOpen = useRef(false);
  const callback = useRef(onDismiss);
  callback.current = onDismiss;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  const [availableHeight, setAvailableHeight] = useState<string>();
  const [viewportTop, setViewportTop] = useState<string>();
  const [viewportBottom, setViewportBottom] = useState<string>();

  useEffect(() => {
    if (!open) {
      // Only a real open -> closed transition unwinds our marker. React
      // StrictMode's effect setup/cleanup probe never initiates history.back().
      if (previouslyOpen.current && historyMode === "marker" &&
          markerRef.current && ownsOverlayHistoryEntry(window.history.state, markerRef.current)) {
        window.history.back();
      }
      markerRef.current = null;
      previouslyOpen.current = false;
      return;
    }
    previouslyOpen.current = true;
    const marker = markerRef.current ?? `lms-overlay:${id}:${++generation.current}`;
    markerRef.current = marker;
    if (!activeOverlayStack.includes(marker)) activeOverlayStack.push(marker);
    if (historyMode === "marker" && !ownsOverlayHistoryEntry(window.history.state, marker)) {
      window.history.pushState({ ...(window.history.state ?? {}), lmsOverlay: marker }, "", window.location.href);
    }

    function hostBack(event: Event) {
      if (activeOverlayStack[activeOverlayStack.length - 1] !== marker) return;
      event.preventDefault();
      if (dismissibleRef.current) callback.current();
    }
    function popstate(event: PopStateEvent) {
      if (historyMode === "route") return; // URL-selected detail owns its history.
      // B -> A on explicit close: the destination still belongs to A.
      // NEVER interpret B's history cleanup as an independent Back for A.
      if (ownsOverlayHistoryEntry(event.state, marker)) return;
      if (activeOverlayStack[activeOverlayStack.length - 1] !== marker) return;
      if (dismissibleRef.current) callback.current();
      else window.history.pushState({ ...(event.state ?? {}), lmsOverlay: marker }, "", window.location.href);
    }
    function resize() {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      setAvailableHeight(`${Math.max(1, Math.floor(height))}px`);
      setViewportTop(`${Math.max(0, Math.floor(top))}px`);
      setViewportBottom(`${Math.max(0, Math.floor(window.innerHeight - top - height))}px`);
    }
    resize();
    window.addEventListener("lms:native-back", hostBack);
    window.addEventListener("popstate", popstate);
    // Embedded WebViews without visualViewport still resize on rotation and
    // when the browser chrome/soft keyboard changes the usable height.
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      window.removeEventListener("lms:native-back", hostBack);
      window.removeEventListener("popstate", popstate);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      const index = activeOverlayStack.lastIndexOf(marker);
      if (index !== -1) activeOverlayStack.splice(index, 1);
      // Deliberately no history.back() in cleanup: StrictMode cleanup, route
      // teardown and pending changes must not pop an unrelated history entry.
    };
  }, [open, id, historyMode]);
  return { availableHeight, viewportTop, viewportBottom };
}
