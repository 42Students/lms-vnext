"use client";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeBatchesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Batches unavailable"
    description="The college batch list could not be loaded. No empty-result conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
