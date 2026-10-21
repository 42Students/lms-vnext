import { useEffect, useRef, useCallback } from "react";

const SWIPE_THRESHOLD_PX = 50;
const HORIZONTAL_DOMINANCE_RATIO = 1.5;
const COOLDOWN_MS = 400;
const MAX_TOUCH_TIME_MS = 500;

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * A horizontal gesture in a form control or an independently scrollable surface
 * belongs to that surface, not the top-level Placements tab navigation.
 */
function shouldIgnoreSwipeTarget(target, container) {
  if (!target?.closest) return false;
  if (target.closest(
    'input, textarea, select, button, a, [contenteditable], [role="slider"], ' +
    '[role="dialog"], [data-swipe-nav-ignore], .ant-carousel, .slick-slider, ' +
    '.learn-career-calendar-page, .learn-career-agenda, .rbc-calendar'
  )) return true;

  // Nested horizontal scrolling, including tables and card carousels, must win
  // over page navigation. A scrollable ancestor may not have a special class.
  let node = target;
  while (node && node !== container) {
    if (node.scrollWidth > node.clientWidth + 1) {
      const overflow = window.getComputedStyle(node).overflowX;
      if (/^(auto|scroll|overlay)$/.test(overflow)) return true;
    }
    node = node.parentElement;
  }
  return false;
}

/** Swipe left/right on non-interactive content to move between Placements tabs. */
export function useSwipeNav({ onSwipeLeft, onSwipeRight, enabled = true } = {}) {
  const containerRef = useRef(null);
  const cooldownUntil = useRef(0);
  const touchState = useRef({
    tracking: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
  });

  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  const handleSwipe = useCallback((direction) => {
    const now = Date.now();
    if (now < cooldownUntil.current) return;
    cooldownUntil.current = now + COOLDOWN_MS;
    if (direction === "left" && onSwipeLeftRef.current) onSwipeLeftRef.current();
    else if (direction === "right" && onSwipeRightRef.current) onSwipeRightRef.current();
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !isTouchDevice()) return;
    const el = containerRef.current;
    if (!el) return;
    const state = touchState.current;

    function onTouchStart(e) {
      if (e.touches.length !== 1 || shouldIgnoreSwipeTarget(e.target, el)) {
        state.tracking = false;
        return;
      }
      const t = e.touches[0];
      state.tracking = true;
      state.startX = t.clientX;
      state.startY = t.clientY;
      state.startTime = Date.now();
      state.currentX = t.clientX;
      state.currentY = t.clientY;
    }

    function onTouchMove(e) {
      if (!state.tracking) return;
      if (e.touches.length !== 1) {
        state.tracking = false;
        return;
      }
      const t = e.touches[0];
      state.currentX = t.clientX;
      state.currentY = t.clientY;
    }

    function onTouchEnd(e) {
      if (!state.tracking) return;
      state.tracking = false;
      // A short, fast gesture may end without an intermediate touchmove event.
      if (e.changedTouches?.length === 1) {
        state.currentX = e.changedTouches[0].clientX;
        state.currentY = e.changedTouches[0].clientY;
      }
      if (Date.now() - state.startTime > MAX_TOUCH_TIME_MS) return;
      const deltaX = state.currentX - state.startX;
      const deltaY = Math.abs(state.currentY - state.startY);
      const absDeltaX = Math.abs(deltaX);
      if (absDeltaX < SWIPE_THRESHOLD_PX) return;
      if (absDeltaX < HORIZONTAL_DOMINANCE_RATIO * deltaY) return;
      handleSwipe(deltaX < 0 ? "left" : "right");
    }

    function onTouchCancel() {
      state.tracking = false;
    }

    const opts = { passive: true };
    el.addEventListener("touchstart", onTouchStart, opts);
    el.addEventListener("touchmove", onTouchMove, opts);
    el.addEventListener("touchend", onTouchEnd, opts);
    el.addEventListener("touchcancel", onTouchCancel, opts);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [enabled, handleSwipe]);

  return containerRef;
}
