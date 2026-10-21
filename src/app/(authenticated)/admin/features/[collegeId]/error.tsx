"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function CollegeModuleAccessError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Could not load module access."
      description="The college's persisted hierarchy could not be read. No effective access decision is inferred from this failure."
      action={
        <Button
          variant="secondary"
          onClick={reset}
         className="w-full md:w-auto">
          Retry
        </Button>
      }
    />
  );
}
