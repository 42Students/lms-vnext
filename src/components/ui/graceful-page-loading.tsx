"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type LoadingShape = "card" | "directory" | "course" | "faculty";
/** One screen-reader status, not one announcement per decorative skeleton. */
export function GracefulPageLoading({
  label, shape = "card",
}: { label?: string; shape?: LoadingShape } = {}) {
  const message = label ?? (shape === "course" ? "Loading course" :
    shape === "faculty" ? "Loading faculty overview" : "Loading your page...");
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 12_000);
    return () => clearTimeout(timer);
  }, [message, shape]);
  return (
    <section data-slot="graceful-page-loading" role="status" aria-live="polite"
      aria-busy="true" className="min-w-0 space-y-5 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-white)] p-4 md:p-[var(--lms-canvas-padding)]">
      <span className="sr-only">{message}</span>
      <div aria-hidden="true" className="min-w-0 space-y-4">
        <div className="lms-skeleton-shimmer h-4 w-[30%] rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
        <div className="lms-skeleton-shimmer h-7 w-[92%] rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
        <div className="lms-skeleton-shimmer h-4 w-[76%] rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
        <div className="flex flex-wrap gap-2 border-b border-[var(--lms-canvas-border)] pb-3">
          {Array.from({length:4},(_,index)=><div key={index}
            className="lms-skeleton-shimmer h-8 w-20 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
        </div>
        {shape === "directory" ? (
          <div className="space-y-2">
            {Array.from({length:8},(_,index)=><div key={index}
              className="lms-skeleton-shimmer h-11 w-full rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({length:4},(_,index)=><div key={index}
              className="lms-skeleton-shimmer h-28 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
          </div>
        )}
      </div>
      {slow ? <div className="flex min-w-0 flex-col items-stretch gap-3 border-t border-[var(--lms-canvas-border)] pt-4 sm:flex-row sm:items-center">
        <p className="m-0 min-w-0 flex-1 break-words text-[13px] leading-5 text-[var(--lms-body-text)]">
          This is taking longer than expected. Please try again.
        </p>
        <Button type="button" variant="secondary" className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9"
          onClick={()=>window.location.reload()}>Try again</Button>
      </div> : null}
    </section>
  );
}
