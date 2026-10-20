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
  return <section data-slot="page-loading" aria-busy="true" className="min-w-0 space-y-[var(--lms-space-4)]">
    <Skeleton variant={variant} count={count} label={label} />
    {slow ? <div role="status" aria-live="polite" className="space-y-[var(--lms-space-3)] rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-[var(--lms-space-4)]">
      <p className="m-0 text-[13px] leading-5 text-[var(--lms-body-text)]">This is taking longer than expected. Please try again.</p>
      <Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
    </div> : null}
  </section>;
}
