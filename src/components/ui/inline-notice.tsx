"use client";

import { useEffect } from "react";

export type InlineNoticeProps = { tone: "error" | "success" | "info"; message: string; onDismiss?: () => void; successDismissMs?: number };

export function InlineNotice({ tone, message, onDismiss, successDismissMs = 5_000 }: InlineNoticeProps) {
  useEffect(() => {
    if (tone !== "success" || !onDismiss) return;
    const timer = setTimeout(onDismiss, successDismissMs);
    return () => clearTimeout(timer);
  }, [tone, message, onDismiss, successDismissMs]);
  return <div role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}
    className={tone === "error" ? "flex min-w-0 items-start gap-3 rounded-md border border-error bg-[var(--lms-error-subtle)] p-3 text-sm text-foreground" :
      "flex min-w-0 items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-foreground"}>
    <span className="min-w-0 flex-1 break-words">{message}</span>
    {onDismiss ? <button type="button" onClick={onDismiss} aria-label="Dismiss notice"
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-sm font-semibold text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Dismiss</button> : null}
  </div>;
}
