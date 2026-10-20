"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegePlacementDepartmentReadinessError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Department placement evidence unavailable"
    description="Placement evidence could not be loaded. No empty-result conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>} />;
}
