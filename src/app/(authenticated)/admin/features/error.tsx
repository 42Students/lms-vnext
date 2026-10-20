"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function SuperAdminFeaturesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0"><ErrorState
      title="Could not load Feature Controls"
      description="The persisted module rules could not be retrieved. Missing data is not interpreted as a source default when the database read fails."
      action={
        <Button
          variant="secondary"
          onClick={reset}
        >
          Retry
        </Button>
      }
    /></section>
  );
}
