"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function GracefulPageLoading({ label = "Loading your page...", shape = "card" }: { label?: string; shape?: "card" | "directory" } = {}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 12_000);
    return () => clearTimeout(timer);
  }, [label, shape]);
  return <section data-slot="graceful-page-loading" aria-busy={true} className="min-w-0 space-y-[var(--lms-space-4)] bg-transparent py-[var(--lms-space-2)]">
    {shape === "directory" ? <>
      <div aria-hidden="true" className="space-y-[var(--lms-space-3)]">
        <Skeleton label={label} variant="line" />
        <Skeleton label={label} variant="form" />
      </div>
      <Skeleton label={label} variant="row" count={3} />
    </> : <>
      <Skeleton label={label} variant="line" count={2} />
      <div aria-hidden="true" className="border-t border-border pt-[var(--lms-space-3)]">
        <Skeleton label={label} variant="row" count={4} />
      </div>
    </>}
    {slow ? <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-[var(--lms-space-3)]">
      <p className="m-0 text-[13px] leading-5 text-[var(--lms-body-text)]">This is taking longer than expected. Please try again.</p>
      <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
    </div> : null}
  </section>;
}
