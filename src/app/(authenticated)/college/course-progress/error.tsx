"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeCourseProgressError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Course progress unavailable"
    description="Learner content activity could not be loaded. No zero-value conclusion is assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
