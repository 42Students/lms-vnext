"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function GracefulPageLoading({ label = "Loading your page...", shape = "card" }: { label?: string; shape?: "card" | "directory" | "faculty-course" } = {}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 12_000);
    return () => clearTimeout(timer);
  }, [label, shape]);
  return <section data-slot="graceful-page-loading" aria-busy={true} className="min-w-0 space-y-[var(--lms-space-4)] bg-transparent py-[var(--lms-space-2)]">
    <span role="status" className="sr-only">{label}</span>
    {shape === "faculty-course" ? <div aria-hidden="true" className="min-w-0 space-y-4">
      <div className="space-y-3 border-b border-border pb-4">
        <div className="h-5 w-[30%] max-w-48 animate-pulse rounded bg-muted"/>
        <div className="h-8 w-[92%] max-w-3xl animate-pulse rounded bg-muted"/>
        <div className="h-4 w-[76%] max-w-2xl animate-pulse rounded bg-muted"/>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {Array.from({length:4},(_,i)=><div key={i} className="h-9 w-24 animate-pulse rounded bg-muted"/>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({length:4},(_,i)=><div key={i}
          className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted"/>
          <div className="h-7 w-2/5 animate-pulse rounded bg-muted"/>
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted"/>
        </div>)}
      </div>
    </div> : shape === "directory" ? <>
      <div aria-hidden="true" className="space-y-[var(--lms-space-3)]">
        <Skeleton label={label} variant="line" />
        <Skeleton label={label} variant="form" />
      </div>
      <Skeleton label={label} variant="row" count={3} />
    </> : <>
      <Skeleton label={label} variant="line" count={2} />
      <div aria-hidden="true" className="border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
        <Skeleton label={label} variant="row" count={4} />
      </div>
    </>}
    {slow ? <div role="status" aria-live="polite" className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] sm:flex-row sm:items-center">
      <p className="m-0 min-w-0 flex-1 break-words text-[13px] leading-5 text-[var(--lms-body-text)]">This is taking longer than expected. Please try again.</p>
      <Button type="button" variant="secondary" className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9" onClick={() => window.location.reload()}>Try again</Button>
    </div> : null}
  </section>;
}
