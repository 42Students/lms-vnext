"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

export default function CollegeReadinessError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not evaluate college readiness"
      description="The checks could not all be retrieved. No ready or passed conclusion is inferred from this error."
      action={
        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button
            variant="secondary"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
            onClick={reset}
          >
            Recheck
          </Button>

          <ButtonLink variant="secondary"
            href="/admin/colleges"
            className="w-full sm:w-auto"
          >
            Colleges
          </ButtonLink>
        </div>
      }
    />
  );
}
