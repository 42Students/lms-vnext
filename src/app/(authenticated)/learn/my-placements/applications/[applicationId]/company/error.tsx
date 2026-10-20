"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerApplicationSubpageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load employer details"
      description="These details could not be retrieved. A failed read must not be shown as an empty record."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={reset}>Retry</Button>
          <Link
            href="/learn/my-placements/applications"
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          >
            Back to applications
          </Link>
        </div>
      }
    />
  );
}
