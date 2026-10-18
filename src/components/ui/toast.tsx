"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/class-names";

type ToastTone = "success" | "error" | "info";
export type ToastItem = { id: string; title: string; description?: string; tone: ToastTone };

export function enqueueToast(current: readonly ToastItem[], incoming: ToastItem, timedLimit = 3): {
  items: ToastItem[]; evictedIds: string[];
} {
  // Errors are persistent: only a user can dismiss them. Limit informational
  // toasts independently without dropping persistent errors.
  const combined = [...current, incoming];
  const timed = combined.filter(item => item.tone !== "error");
  const drop = new Set(timed.slice(0, Math.max(0, timed.length - timedLimit)).map(item => item.id));
  return { items: combined.filter(item => !drop.has(item.id)), evictedIds: [...drop] };
}
type ToastInput = Omit<ToastItem, "id">;
type ToastContextValue = { showToast: (toast: ToastInput) => void };
const ToastContext = createContext<ToastContextValue | null>(null);
const toneClasses = { success: "border-success", error: "border-error", info: "border-primary" } as const;
const dotClasses = { success: "bg-success", error: "bg-error", info: "bg-primary" } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const itemsRef = useRef<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    itemsRef.current = itemsRef.current.filter(toast => toast.id !== id);
    setToasts(itemsRef.current);
  }, []);
  const showToast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const { items, evictedIds } = enqueueToast(itemsRef.current, { ...input, id });
    for (const evictedId of evictedIds) {
      const staleTimer = timers.current.get(evictedId);
      if (staleTimer) clearTimeout(staleTimer);
      timers.current.delete(evictedId);
    }
    itemsRef.current = items;
    setToasts(items);
    // Errors must remain readable/recoverable until explicitly dismissed.
    // Longer informational messages get time proportional to reading length.
    if (input.tone !== "error") {
      const readingTime = Math.max(4500, Math.min(15000, 2500 + (input.title.length + (input.description?.length ?? 0)) * 70));
      const timer = setTimeout(() => dismiss(id), readingTime);
      timers.current.set(id, timer);
    }
  }, [dismiss]);
  useEffect(() => {
    const currentTimers = timers.current;
    return () => { currentTimers.forEach(timer => clearTimeout(timer)); currentTimers.clear(); };
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>
    {children}
    <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4">
      {toasts.map(toast => <section key={toast.id} role={toast.tone === "error" ? "alert" : "status"}
        className={cx("pointer-events-auto min-w-0 rounded-lg border border-l-4 bg-surface p-3 text-foreground shadow-lg", toneClasses[toast.tone])}>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dotClasses[toast.tone])} />
          <div className="min-w-0 flex-1">
            <p className="m-0 break-words text-sm font-semibold text-foreground">{toast.title}</p>
            {toast.description ? <p className="mt-1 break-words text-sm leading-6 text-body">{toast.description}</p> : null}
          </div>
          <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-lg font-semibold text-foreground hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">×</button>
        </div>
      </section>)}
    </div>
  </ToastContext.Provider>;
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
