"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeDashboardError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="College dashboard unavailable"
    description="The college setup evidence could not be loaded. Missing data is not displayed as zero."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}
