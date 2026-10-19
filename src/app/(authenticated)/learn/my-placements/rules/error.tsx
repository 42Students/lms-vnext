"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function LearnerPlacementRulesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load placement rules"
      description="Your placement evidence could not be retrieved. This is a loading failure, not proof that your academic record is empty."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={reset}>Retry</Button>
          <Link href="/learn/my-placements"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
            Back to My Placements
          </Link>
        </div>
      }
    />
  );
}
