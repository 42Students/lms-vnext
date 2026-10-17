"use client";

/**
 * GR-10: persistent error, optionally auto-dismissed success.
 * Usage: <InlineNotice tone="error" message={error} onDismiss={() => setError(null)} />
 * Rendering never steals focus. Parent controls when a notice is visible.
 */
import { useEffect } from "react";

export type InlineNoticeProps = {
  tone: "error" | "success" | "info";
  message: string;
  onDismiss?: () => void;
  successDismissMs?: number;
};

export function InlineNotice({
  tone, message, onDismiss, successDismissMs = 5_000,
}: InlineNoticeProps) {
  useEffect(() => {
    if (tone !== "success" || !onDismiss) return;
    const timer = setTimeout(onDismiss, successDismissMs);
    return () => clearTimeout(timer);
  }, [tone, message, onDismiss, successDismissMs]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={tone === "error"
        ? "flex min-w-0 items-start gap-3 rounded-md border border-error bg-error-subtle px-4 py-3 text-sm text-foreground"
        : "flex min-w-0 items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground"}
    >
      <span className="min-w-0 flex-1 break-words">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss}
          aria-label="Dismiss notice"
          className="shrink-0 rounded px-2 py-1 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
          Dismiss
        </button>
      )}
    </div>
  );
}
