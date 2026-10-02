"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cx } from "@/lib/class-names";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<ToastItem, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(
  null,
);

const toneClasses = {
  success:
    "border-success bg-surface text-foreground",
  error:
    "border-error bg-surface text-foreground",
  info:
    "border-primary bg-surface text-foreground",
} as const;

const dotClasses = {
  success: "bg-success",
  error: "bg-error",
  info: "bg-primary",
} as const;

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [
        ...current,
        { ...input, id },
      ]);

      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ showToast }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions removals"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cx(
              "pointer-events-auto rounded-lg border-l-4 px-4 py-3 shadow-lg",
              toneClasses[toast.tone],
            )}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cx(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  dotClasses[toast.tone],
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-semibold text-foreground">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-5 text-body">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="rounded px-1 text-sm font-semibold text-muted-foreground hover:bg-primary-subtle hover:text-primary-text"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within ToastProvider",
    );
  }

  return context;
}
