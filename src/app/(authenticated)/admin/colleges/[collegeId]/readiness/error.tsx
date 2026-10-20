"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function CollegeReadinessError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not evaluate college readiness"
      description="The checks could not all be retrieved. No ready or passed conclusion is inferred from this error."
      action={
        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button
            variant="secondary"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
            onClick={reset}
          >
            Recheck
          </Button>

          <Link
            href="/admin/colleges"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] sm:w-auto border border-border bg-surface px-4 text-sm font-[650] text-body hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
          >
            Colleges
          </Link>
        </div>
      }
    />
  );
}
