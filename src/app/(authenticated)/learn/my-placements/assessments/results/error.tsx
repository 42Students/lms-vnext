"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerAssessmentResultsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load assessment results"
      description="The official result feed could not be retrieved. This does not mean you have no results."
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
          <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
          <ButtonLink variant="secondary" href="/learn/my-placements/assessments"
            className="w-full sm:w-auto">
            Assessment schedule
          </ButtonLink>
        </div>
      }
    />
  );
}
