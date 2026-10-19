"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Button } from "@/components/ui/button";

type ToastTone = "success" | "error" | "info";
export type ToastItem = { id: string; title: string; description?: string; tone: ToastTone };

export function enqueueToast(current: readonly ToastItem[], incoming: ToastItem, timedLimit = 3): {
  items: ToastItem[]; evictedIds: string[];
} {
  // Errors are persistent: only a user can dismiss them. Limit informational
  // toasts independently without dropping persistent errors.
  // Repeated event IDs update an existing message instead of introducing
  // duplicate React keys or leaving two dismissable copies of one event.
  const combined = [...current.filter(item => item.id !== incoming.id), incoming];
  const limit = Number.isFinite(timedLimit) ? Math.max(0, Math.trunc(timedLimit)) : 3;
  const timed = combined.filter(item => item.tone !== "error");
  const drop = new Set(timed.slice(0, Math.max(0, timed.length - limit)).map(item => item.id));
  return { items: combined.filter(item => !drop.has(item.id)), evictedIds: [...drop] };
}
type ToastInput = Omit<ToastItem, "id">;
type ToastContextValue = { showToast: (toast: ToastInput) => void };
const ToastContext = createContext<ToastContextValue | null>(null);
const toneClasses = { success: "border-success", error: "border-error", info: "border-primary" } as const;
const dotClasses = { success: "bg-success", error: "bg-error", info: "bg-primary" } as const;

export function clearEvictedToastTimers(
  evictedIds: readonly string[],
  timers: Map<string, ReturnType<typeof setTimeout>>,
  cancel: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
): void {
  for (const id of evictedIds) {
    const timer = timers.get(id);
    if (timer) cancel(timer);
    timers.delete(id);
  }
}

export type ToastViewport = { height: number; bottom: number };

/** Persistent errors are never evicted. The whole notification list remains
 * keyboard-focusable and scrolls within the actual visual viewport, including
 * safe areas and a software keyboard. No offscreen dismiss buttons are lost.
 */
export function ToastStack({ toasts, onDismiss, viewport, onInteractionChange }: {
  toasts: readonly ToastItem[];
  onDismiss: (id: string) => void;
  viewport?: ToastViewport | null;
  onInteractionChange?: (kind: "hover" | "focus", active: boolean) => void;
}) {
  const bounds = {
    "--lms-toast-visual-height": viewport ? `${viewport.height}px` : "100dvh",
    "--lms-toast-visual-bottom": viewport ? `${viewport.bottom}px` : "0px",
    bottom: "calc(var(--lms-toast-visual-bottom) + max(1rem, env(safe-area-inset-bottom)))",
    maxHeight: "max(1px, calc(var(--lms-toast-visual-height) - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom))))",
  } as CSSProperties;
  return <div data-slot="toast-stack" role="region"
    aria-label="Notifications, scroll to review all notices"
    aria-live="polite" aria-relevant="additions"
    onMouseEnter={() => onInteractionChange?.("hover", true)}
    onMouseLeave={() => onInteractionChange?.("hover", false)}
    onFocusCapture={() => onInteractionChange?.("focus", true)}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) onInteractionChange?.("focus", false);
    }}
    tabIndex={toasts.length > 0 ? 0 : -1}
    style={bounds}
    className="lms-toast-scroll-cue pointer-events-auto fixed inset-x-4 z-[1050] flex min-w-0 max-w-sm flex-col gap-[var(--lms-space-2)] overflow-y-auto overscroll-contain rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:inset-x-auto sm:right-4">
    {toasts.map(toast => <section key={toast.id} role={toast.tone === "error" ? "alert" : "status"}
      className={cx("min-w-0 shrink-0 rounded-[12px] border border-l-4 bg-surface px-4 py-3 text-foreground shadow-[var(--lms-toast-shadow)]", toneClasses[toast.tone])}>
      <div className="flex items-start gap-[var(--lms-space-3)]">
        <span aria-hidden="true" className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dotClasses[toast.tone])} />
        <div className="min-w-0 flex-1">
          <p className="m-0 break-words text-[13px] leading-5 font-semibold text-[var(--lms-heading)]">{toast.title}</p>
          {toast.description ? <p className="mt-1 break-words text-[13px] leading-5 text-[var(--lms-body-text)]">{toast.description}</p> : null}
        </div>
        <Button variant="ghost" type="button" aria-label={`Dismiss ${toast.tone === "error" ? "error" : "notification"}: ${toast.title}`}
          onClick={() => onDismiss(toast.id)}
          className="min-h-11 min-w-11 shrink-0 rounded-[var(--lms-control-radius)] p-0 text-lg text-[var(--lms-muted-text)]"><span aria-hidden="true">×</span></Button>
      </div>
    </section>)}
  </div>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [viewport, setViewport] = useState<ToastViewport | null>(null);
  const itemsRef = useRef<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const readingDurations = useRef<Map<string, number>>(new Map());
  const interacting = useRef({ hover: false, focus: false });
  // Toast IDs are React keys, not credentials. Some embedded WebViews have no
  // crypto.randomUUID; a provider-scoped monotonic counter is collision-free
  // for the life of this mounted notification stack.
  const nextToastOrdinal = useRef(0);
  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    readingDurations.current.delete(id);
    itemsRef.current = itemsRef.current.filter(toast => toast.id !== id);
    setToasts(itemsRef.current);
  }, []);
  const scheduleTimedToast = useCallback((id: string, duration: number) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    timers.current.delete(id);
    if (!document.hidden && !interacting.current.hover && !interacting.current.focus) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
  }, [dismiss]);
  const onInteractionChange = useCallback((kind: "hover" | "focus", active: boolean) => {
    const pausedBefore = interacting.current.hover || interacting.current.focus;
    interacting.current[kind] = active;
    const pausedNow = interacting.current.hover || interacting.current.focus;
    if (pausedBefore === pausedNow) return;
    if (pausedNow) {
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current.clear();
    } else {
      for (const [id, duration] of readingDurations.current) {
        if (itemsRef.current.some(toast => toast.id === id)) scheduleTimedToast(id, duration);
      }
    }
  }, [scheduleTimedToast]);
  const showToast = useCallback((input: ToastInput) => {
    const id = "toast-" + ++nextToastOrdinal.current;
    const { items, evictedIds } = enqueueToast(itemsRef.current, { ...input, id });
    clearEvictedToastTimers(evictedIds, timers.current);
    for (const evictedId of evictedIds) readingDurations.current.delete(evictedId);
    itemsRef.current = items;
    setToasts(items);
    // Errors must remain readable/recoverable until explicitly dismissed.
    // Longer informational messages get time proportional to reading length.
    if (input.tone !== "error") {
      const readingTime = Math.max(4500, Math.min(15000, 2500 + (input.title.length + (input.description?.length ?? 0)) * 70));
      readingDurations.current.set(id, readingTime);
      scheduleTimedToast(id, readingTime);
    }
  }, [scheduleTimedToast]);
  useEffect(() => {
    function visibilityChange() {
      if (document.hidden) {
        timers.current.forEach(timer => clearTimeout(timer));
        timers.current.clear();
      } else {
        for (const [id, duration] of readingDurations.current) {
          if (itemsRef.current.some(toast => toast.id === id)) scheduleTimedToast(id, duration);
        }
      }
    }
    document.addEventListener("visibilitychange", visibilityChange);
    return () => document.removeEventListener("visibilitychange", visibilityChange);
  }, [scheduleTimedToast]);
  useEffect(() => {
    const currentTimers = timers.current;
    return () => { currentTimers.forEach(timer => clearTimeout(timer)); currentTimers.clear(); };
  }, []);
  useEffect(() => {
    const visual = window.visualViewport;
    function updateViewport() {
      const height = Math.max(1, Math.floor(visual?.height ?? window.innerHeight));
      const bottom = Math.max(0, Math.floor(window.innerHeight - (visual?.offsetTop ?? 0) - height));
      setViewport(current => current?.height === height && current.bottom === bottom
        ? current : { height, bottom });
    }
    updateViewport();
    visual?.addEventListener("resize", updateViewport);
    visual?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);
    return () => {
      visual?.removeEventListener("resize", updateViewport);
      visual?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>
    {children}
    <ToastStack toasts={toasts} onDismiss={dismiss} viewport={viewport} onInteractionChange={onInteractionChange}/>
  </ToastContext.Provider>;
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
