"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegePlacementDepartmentReadinessError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Department placement evidence unavailable"
    description="Placement evidence could not be loaded. No empty-result conclusion is assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
