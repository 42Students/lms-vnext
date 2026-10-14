"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeActivityError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Activity Log unavailable"
    description="College activity could not be loaded. An empty result is not assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
