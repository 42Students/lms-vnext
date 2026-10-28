"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { OverlayCloseIcon } from "@/components/ui/overlay-close-icon";

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
const toneClasses = { success: "border-success", error: "border-error", info: "border-info" } as const;
const dotClasses = { success: "bg-success", error: "bg-error", info: "bg-info" } as const;

export function clearEvictedToastTimers(
  evictedIds: readonly string[],
  timers: Map<string, ReturnType<typeof setTimeout>>,
  cancel: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
): void {
  for (const id of evictedIds) {
    const timer = timers.get(id);
    if (timer !== undefined) cancel(timer);
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
    bottom: "calc(var(--lms-toast-visual-bottom) + var(--lms-toast-navigation-offset, 0px) + max(1rem, env(safe-area-inset-bottom)))",
    maxHeight: "max(1px, calc(var(--lms-toast-visual-height) - var(--lms-toast-navigation-offset, 0px) - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom))))",
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
    className="lms-toast-scroll-cue pointer-events-auto fixed inset-x-4 z-[1000] flex w-[calc(100vw_-_2rem)] min-w-0 max-w-[min(420px,calc(100vw_-_32px))] flex-col gap-[var(--lms-space-2)] overflow-y-auto overscroll-contain rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:inset-x-auto sm:right-4 sm:w-[min(420px,calc(100vw_-_32px))]">
    {toasts.map(toast => <section key={toast.id} role={toast.tone === "error" ? "alert" : "status"}
      className={cx("min-w-0 shrink-0 rounded-[var(--lms-canvas-radius)] border border-l-4 bg-surface px-4 py-3 text-foreground shadow-[var(--lms-toast-shadow)]", toneClasses[toast.tone])}>
      <div className="flex items-start gap-[var(--lms-space-3)]">
        <span aria-hidden="true" className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dotClasses[toast.tone])} />
        <div className="min-w-0 flex-1">
          <p className="m-0 break-words text-[13px] font-semibold leading-5 text-[var(--lms-heading)]">{toast.title}</p>
          {toast.description ? <p className="mt-1 break-words text-[13px] leading-5 text-[var(--lms-body-text)]">{toast.description}</p> : null}
        </div>
        <Button variant="ghost" type="button" aria-label={`Dismiss ${toast.tone === "error" ? "error" : "notification"}: ${toast.title}`}
          onClick={() => onDismiss(toast.id)}
          className="min-h-11 min-w-11 shrink-0 rounded-[var(--lms-control-radius)] p-0 text-lg text-[var(--lms-muted-text)] hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"><OverlayCloseIcon /></Button>
      </div>
    </section>)}
  </div>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [viewport, setViewport] = useState<ToastViewport | null>(null);
  // Native showModal() dialogs are in the browser top layer. A toast mounted
  // outside that layer is visible but cannot be clicked or keyboard-focused.
  const [toastModal, setToastModal] = useState<HTMLDialogElement | null>(null);
  const itemsRef = useRef<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Store time remaining rather than restarting the full reading duration after a pause.
  const readingDurations = useRef<Map<string, number>>(new Map());
  const timerStartedAt = useRef<Map<string, number>>(new Map());
  const interacting = useRef({ hover: false, focus: false });
  // Toast IDs are React keys, not credentials. Some embedded WebViews have no
  // crypto.randomUUID; a provider-scoped monotonic counter is collision-free
  // for the life of this mounted notification stack.
  const nextToastOrdinal = useRef(0);
  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) clearTimeout(timer);
    timers.current.delete(id);
    timerStartedAt.current.delete(id);
    readingDurations.current.delete(id);
    itemsRef.current = itemsRef.current.filter(toast => toast.id !== id);
    setToasts(itemsRef.current);
  }, []);
  const scheduleTimedToast = useCallback((id: string, duration: number) => {
    const existing = timers.current.get(id);
    if (existing !== undefined) clearTimeout(existing);
    timers.current.delete(id);
    timerStartedAt.current.delete(id);
    if (!document.hidden && !interacting.current.hover && !interacting.current.focus) {
      timerStartedAt.current.set(id, Date.now());
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
  }, [dismiss]);
  const pauseTimedToasts = useCallback(() => {
    const now = Date.now();
    for (const [id, timer] of timers.current) {
      clearTimeout(timer);
      const started = timerStartedAt.current.get(id);
      const remaining = readingDurations.current.get(id);
      if (started !== undefined && remaining !== undefined) {
        readingDurations.current.set(id, Math.max(0, remaining - Math.max(0, now - started)));
      }
    }
    timers.current.clear();
    timerStartedAt.current.clear();
  }, []);
  const onInteractionChange = useCallback((kind: "hover" | "focus", active: boolean) => {
    const pausedBefore = interacting.current.hover || interacting.current.focus;
    interacting.current[kind] = active;
    const pausedNow = interacting.current.hover || interacting.current.focus;
    if (pausedBefore === pausedNow) return;
    if (pausedNow) {
      pauseTimedToasts();
    } else {
      for (const [id, duration] of readingDurations.current) {
        if (itemsRef.current.some(toast => toast.id === id)) scheduleTimedToast(id, duration);
      }
    }
  }, [pauseTimedToasts, scheduleTimedToast]);
  const showToast = useCallback((input: ToastInput) => {
    // Portal into the uppermost native modal while it is open. z-index alone
    // cannot place a toast above a top-layer <dialog>; this makes its dismiss
    // control reachable without closing or weakening the underlying dialog.
    const modals = document.querySelectorAll<HTMLDialogElement>("dialog:modal");
    setToastModal(modals.length ? modals[modals.length - 1]! : null);
    const id = "toast-" + ++nextToastOrdinal.current;
    const { items, evictedIds } = enqueueToast(itemsRef.current, { ...input, id });
    clearEvictedToastTimers(evictedIds, timers.current);
    for (const evictedId of evictedIds) {
      readingDurations.current.delete(evictedId);
      timerStartedAt.current.delete(evictedId);
    }
    itemsRef.current = items;
    setToasts(items);
    // Errors must remain readable/recoverable until explicitly dismissed.
    // No canonical old-LMS toast lifetime exists in bundled legacy SCSS;
    // preserve the established 4.5–15s proportional reading-time policy.
    // Longer informational messages get time proportional to reading length.
    if (input.tone !== "error") {
      const readingTime = Math.max(4500, Math.min(15000, 2500 + (input.title.length + (input.description?.length ?? 0)) * 70));
      readingDurations.current.set(id, readingTime);
      scheduleTimedToast(id, readingTime);
    }
  }, [scheduleTimedToast]);
  useEffect(() => {
    if (!toastModal) return;
    const restore = () => setToastModal(current => current === toastModal ? null : current);
    toastModal.addEventListener("close", restore);
    return () => toastModal.removeEventListener("close", restore);
  }, [toastModal]);
  useEffect(() => {
    function visibilityChange() {
      if (document.hidden) {
        pauseTimedToasts();
      } else {
        for (const [id, duration] of readingDurations.current) {
          if (itemsRef.current.some(toast => toast.id === id)) scheduleTimedToast(id, duration);
        }
      }
    }
    document.addEventListener("visibilitychange", visibilityChange);
    return () => document.removeEventListener("visibilitychange", visibilityChange);
  }, [pauseTimedToasts, scheduleTimedToast]);
  useEffect(() => {
    const currentTimers = timers.current;
    const currentStarted = timerStartedAt.current;
    return () => { currentTimers.forEach(timer => clearTimeout(timer)); currentTimers.clear(); currentStarted.clear(); };
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
  const toastStack = <ToastStack toasts={toasts} onDismiss={dismiss}
    viewport={viewport} onInteractionChange={onInteractionChange}/>;
  return <ToastContext.Provider value={value}>
    {children}
    {toastModal?.isConnected && toastModal.matches(":modal")
      ? createPortal(toastStack, toastModal)
      : toastStack}
  </ToastContext.Provider>;
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

/** Persistent actionable feedback (for example, a short undo window).
 * An inline form remains mounted and functional, unlike a timed status toast. */
export function ToastAction({ title, children, tone = "info" }: {
  title: string;
  children: ReactNode;
  tone?: ToastTone;
}) {
  return <div data-slot="toast-action" role={tone === "error" ? "alert" : "status"}
    className={cx("flex min-w-0 flex-col items-stretch gap-3 rounded-[var(--lms-canvas-radius)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border border-l-4 bg-surface px-4 py-3 text-foreground shadow-[var(--lms-toast-shadow)]", toneClasses[tone])}>
    <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className={cx("h-2.5 w-2.5 shrink-0 rounded-full", dotClasses[tone])} />
      <p className="min-w-0 break-words text-sm text-[var(--lms-body-text)] leading-[22px]">{title}</p>
    </div>
    <div className="min-w-0 max-[639px]:w-full max-[639px]:[&>*]:w-full sm:shrink-0">{children}</div>
  </div>;
}
