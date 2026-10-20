"use client";
import { Button } from "@/components/ui/button";

import { ErrorState } from "@/components/ui/error-state";
export default function CollegeBatchPromotionError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Batch promotion preview unavailable"
    description="The persisted progression or learner data could not be loaded; no readiness conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
