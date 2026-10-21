import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------
const EDGE_ZONE_PX = 24; // Touch must start within this many px from left edge
const SWIPE_THRESHOLD_PX = 70; // Minimum horizontal distance to trigger back
const HORIZONTAL_DOMINANCE_RATIO = 1.5; // Horizontal movement must be 1.5x vertical
const COOLDOWN_MS = 450; // Prevent duplicate triggers
const MAX_TOUCH_TIME_MS = 500; // Gesture must complete within this (avoid long-press confusion)

// Routes where we skip swipe-back (entry/landing; going "back" could exit app)
const SKIP_PATHS = ["/", "/login", "/signin", "/signup", "/register"];

/**
 * Detect iOS (iPhone, iPad, iPod) to skip custom gesture — native swipe-back exists.
 * Includes iPadOS 13+ which reports as MacIntel with maxTouchPoints.
 */
function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

/**
 * Check if the device supports touch events (mobile, tablet, touch laptops).
 */
function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if we should allow back navigation.
 * Avoids going "back" when we're at an entry route (could exit to external).
 */
function canGoBack(router) {
  if (!router || typeof router.back !== "function") return false;
  if (typeof window === "undefined" || !window.history) return false;
  if (window.history.length <= 1) return false;
  const path = router.asPath?.split("?")[0] || "";
  if (SKIP_PATHS.some((p) => path === p || path.startsWith(p + "/")))
    return false;
  return true;
}

/**
 * useSwipeBack — Swipe from left edge to right to navigate back.
 *
 * - Disabled on iOS (native gesture used instead)
 * - Only active on touch devices
 * - Touch must start in left edge zone (EDGE_ZONE_PX)
 * - Swipe right must exceed SWIPE_THRESHOLD_PX
 * - Horizontal movement must dominate over vertical (avoid scroll false positives)
 * - Cooldown prevents double-trigger
 * - Skips when no history or on entry routes
 */
export function useSwipeBack() {
  const router = useRouter();
  const cooldownUntil = useRef(0);
  const touchState = useRef({
    tracking: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
  });

  const handleBack = useCallback(() => {
    if (!canGoBack(router)) return;
    const now = Date.now();
    if (now < cooldownUntil.current) return;
    cooldownUntil.current = now + COOLDOWN_MS;
    try {
      router.back();
    } catch (err) {
      // Fallback if router.back fails (e.g. during transition)
      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    if (isIOS()) return;
    if (!isTouchDevice()) return;

    const state = touchState.current;

    function onTouchStart(e) {
      if (e.touches.length !== 1) {
        state.tracking = false;
        return;
      }
      const t = e.touches[0];
      const x = t.clientX;
      const y = t.clientY;
      if (x > EDGE_ZONE_PX) {
        state.tracking = false;
        return;
      }
      state.tracking = true;
      state.startX = x;
      state.startY = y;
      state.startTime = Date.now();
      state.currentX = x;
      state.currentY = y;
    }

    function onTouchMove(e) {
      if (!state.tracking || e.touches.length !== 1) return;
      const t = e.touches[0];
      state.currentX = t.clientX;
      state.currentY = t.clientY;
      // Cancel if user clearly moved left (changed mind) or way off
      const deltaX = state.currentX - state.startX;
      if (deltaX < -20) {
        state.tracking = false;
      }
    }

    function onTouchEnd() {
      if (!state.tracking) return;
      const deltaX = state.currentX - state.startX;
      const deltaY = Math.abs(state.currentY - state.startY);
      const elapsed = Date.now() - state.startTime;

      state.tracking = false;

      if (elapsed > MAX_TOUCH_TIME_MS) return;
      if (deltaX < SWIPE_THRESHOLD_PX) return;
      if (deltaX < HORIZONTAL_DOMINANCE_RATIO * deltaY) return;

      handleBack();
    }

    function onTouchCancel() {
      state.tracking = false;
    }

    const opts = { passive: true };
    document.addEventListener("touchstart", onTouchStart, opts);
    document.addEventListener("touchmove", onTouchMove, opts);
    document.addEventListener("touchend", onTouchEnd, opts);
    document.addEventListener("touchcancel", onTouchCancel, opts);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [handleBack]);

  return null;
}

