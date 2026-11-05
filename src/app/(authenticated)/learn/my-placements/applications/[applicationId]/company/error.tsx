"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerApplicationSubpageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load employer details"
      description="These details could not be retrieved. A failed read must not be shown as an empty record."
      action={
        <div className="flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
          <ButtonLink variant="secondary"
            href="/learn/my-placements/applications"
            className="w-full sm:w-auto"
          >
            Back to applications
          </ButtonLink>
        </div>
      }
    />
  );
}
