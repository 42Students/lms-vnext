"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerOffersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load your offers"
      description="The offer records could not be retrieved. This does not mean there are no offers."
      action={
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={reset}>Retry</Button>
          <ButtonLink variant="secondary" href="/learn/my-placements/applications"
            className="w-full sm:w-auto">
            Applications
          </ButtonLink>
        </div>
      }
    />
  );
}
