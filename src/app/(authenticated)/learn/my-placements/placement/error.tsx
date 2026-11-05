"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerPlacementCellError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load placement cell"
      description="Offers, requests or placement alerts could not be retrieved. A failed read must not appear as an empty list."
      action={<div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={reset}>Retry</Button>
        <ButtonLink variant="secondary" href="/learn/my-placements"
          className="w-full sm:w-auto">
          Placements dashboard
        </ButtonLink>
      </div>}
    />
  );
}
