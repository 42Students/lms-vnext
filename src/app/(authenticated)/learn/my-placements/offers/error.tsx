"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerOffersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load your offers"
      description="The offer records could not be retrieved. This does not mean there are no offers."
      action={
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button className="max-md:min-h-11" variant="secondary" onClick={reset}>Retry</Button>
          <Link href="/learn/my-placements/applications"
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body">
            Applications
          </Link>
        </div>
      }
    />
  );
}
