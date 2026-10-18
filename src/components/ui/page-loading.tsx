"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton, type SkeletonProps } from "@/components/ui/skeleton";

export type PageLoadingProps = { label: string; variant: SkeletonProps["variant"]; count?: number };

export function PageLoading({ label, variant, count = 3 }: PageLoadingProps) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 12_000);
    return () => clearTimeout(timer);
  }, [label, variant, count]);
  return <section data-slot="page-loading" className="min-w-0 space-y-4">
    <Skeleton variant={variant} count={count} label={label} />
    {slow ? <div role="status" aria-live="polite" className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm leading-6 text-body">This is taking longer than expected. Please try again.</p>
      <Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
    </div> : null}
  </section>;
}
