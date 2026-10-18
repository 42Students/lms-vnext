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
  return <section className="min-w-0 space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
    {shape === "directory" ? <>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton label={label} variant="line" />
        <Skeleton label={label} variant="form" />
      </div>
      <Skeleton label={label} variant="row" count={3} />
    </> : <Skeleton label={label} variant="card" count={2} />}
    {slow ? <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-foreground">This is taking longer than expected. Please try again.</p>
      <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
    </div> : null}
  </section>;
}
