"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeContactProfileErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="College profile unavailable"
    description="The college contact profile could not be loaded. No blank values are assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
