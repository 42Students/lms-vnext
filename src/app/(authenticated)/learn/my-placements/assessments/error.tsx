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
      action={<div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/learn/my-placements"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          My Placements
        </Link>
      </div>}
    />
  );
}
