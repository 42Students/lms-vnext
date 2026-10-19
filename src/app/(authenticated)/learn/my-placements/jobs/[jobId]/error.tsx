"use client";
import { ErrorState } from "@/components/ui/error-state";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerJobDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState title={"Unable to load this drive"} description={"Drive information could not be loaded. This is different from an unavailable or removed job."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/my-placements/jobs"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Back to Drives
        </Link></div>} />
  );
}
