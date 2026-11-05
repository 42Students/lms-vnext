"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

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
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={reset}>Retry</Button>
          <ButtonLink variant="secondary" href="/learn/my-placements"
            className="w-full sm:w-auto">
            Back to My Placements
          </ButtonLink>
        </div>
      }
    />
  );
}
