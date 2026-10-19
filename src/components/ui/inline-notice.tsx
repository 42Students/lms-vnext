"use client";

import { useEffect } from "react";
import { cx } from "@/lib/class-names";

export type InlineNoticeProps = { tone: "error" | "success" | "info"; message: string; onDismiss?: () => void; successDismissMs?: number };

const toneClasses = {
  error: "border-[rgba(239,68,68,0.25)] bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
  success: "border-[rgba(5,150,105,0.25)] bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
  info: "border-[var(--lms-info-border)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
} as const;

export function InlineNotice({ tone, message, onDismiss, successDismissMs = 5_000 }: InlineNoticeProps) {
  useEffect(() => {
    if (tone !== "success" || !onDismiss) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A background tab should not erase a success announcement before the
    // operator has had a chance to read it upon returning to the workspace.
    function scheduleWhenVisible() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      if (!document.hidden) timer = setTimeout(onDismiss!, successDismissMs);
    }
    document.addEventListener("visibilitychange", scheduleWhenVisible);
    scheduleWhenVisible();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener("visibilitychange", scheduleWhenVisible);
    };
  }, [tone, message, onDismiss, successDismissMs]);
  return <div data-slot="inline-notice" data-tone={tone} role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}
    className={cx("flex min-w-0 items-start gap-3 rounded-[var(--lms-control-radius)] border px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-[13px] leading-5", toneClasses[tone])}>
    <span className="min-w-0 flex-1 break-words">{message}</span>
    {onDismiss ? <button type="button" onClick={onDismiss} aria-label="Dismiss notice"
      className="inline-flex min-h-11 min-w-11 sm:min-h-[var(--lms-control-height)] sm:min-w-[var(--lms-control-height)] shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] px-2 text-[13px] font-semibold text-inherit underline hover:bg-white/50 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Dismiss</button> : null}
  </div>;
}
