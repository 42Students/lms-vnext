"use client";
import { ErrorState } from "@/components/ui/error-state";

export default function CollegeDashboardError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="College dashboard unavailable"
    description="The college setup evidence could not be loaded. Missing data is not displayed as zero."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Retry
    </button>} />;
}
