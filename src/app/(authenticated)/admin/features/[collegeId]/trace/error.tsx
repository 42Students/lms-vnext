"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function SuperAdminModuleTraceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0"><ErrorState
      title="Could not resolve learner access"
      description="The college-scoped learner or module-rule data could not be loaded. No access decision has been inferred from this failure."
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
