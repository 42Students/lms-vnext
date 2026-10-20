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
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button className="max-md:min-h-11" variant="secondary" onClick={reset}>Retry</Button>
          <Link href="/learn/my-placements"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
            Back to My Placements
          </Link>
        </div>
      }
    />
  );
}
