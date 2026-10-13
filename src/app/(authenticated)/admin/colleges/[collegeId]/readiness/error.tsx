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
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="secondary"
            onClick={reset}
          >
            Recheck
          </Button>

          <Link
            href="/admin/colleges"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Colleges
          </Link>
        </div>
      }
    />
  );
}
