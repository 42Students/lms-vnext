"use client";

import { useEffect } from "react";
import { cx } from "@/lib/class-names";

export type InlineNoticeProps = { tone: "error" | "success" | "info"; message: string; onDismiss?: () => void; successDismissMs?: number };

const toneClasses = {
  error: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] text-[#b91c1c]",
  success: "border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] text-[#065f46]",
  info: "border-[#bde9ec] bg-[#eff8fa] text-[#1a95a1]",
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
    className={cx("flex min-w-0 items-start gap-3 rounded-[9px] border px-4 py-3 text-[13px] leading-5", toneClasses[tone])}>
    <span className="min-w-0 flex-1 break-words">{message}</span>
    {onDismiss ? <button type="button" onClick={onDismiss} aria-label="Dismiss notice"
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[9px] px-2 text-[13px] font-semibold text-inherit underline hover:bg-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26bac7]">Dismiss</button> : null}
  </div>;
}
