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
      action={<div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button className="max-md:min-h-11" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements"
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          My Placements
        </Link>
      </div>}
    />
  );
}
