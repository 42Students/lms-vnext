"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Could not load job types"
      description="The job-type choices could not be retrieved. Retry to load them."
      action={<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}
    />
  );
}
