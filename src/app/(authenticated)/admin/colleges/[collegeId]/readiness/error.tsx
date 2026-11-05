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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] sm:w-auto border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-body hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-[color:var(--lms-on-primary)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-[color:var(--lms-on-primary)] focus-ring md:min-h-9"
          >
            Colleges
          </Link>
        </div>
      }
    />
  );
}
