"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerAssessmentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load assessments"
      description="Your assessment schedule could not be retrieved. This is a loading failure, not proof that you have no assessments."
      action={<div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements"
          className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          My Placements
        </Link>
      </div>}
    />
  );
}
