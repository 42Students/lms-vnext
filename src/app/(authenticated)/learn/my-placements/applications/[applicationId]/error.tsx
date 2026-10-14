"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerApplicationDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load application details"
      description="The requested history or company information could not be retrieved. No data has been assumed missing."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={reset}>Retry</Button>
          <Link
            href="/learn/my-placements/applications"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Applications
          </Link>
        </div>
      }
    />
  );
}
