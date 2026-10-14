"use client";

import { ErrorState } from "@/components/ui/error-state";
export default function CollegeBatchPromotionError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <ErrorState title="Batch promotion preview unavailable"
    description="The persisted progression or learner data could not be loaded; no readiness conclusion is assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
