"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeDepartmentAttendanceError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Department attendance unavailable"
    description="The attendance evidence could not be loaded. No zero-value conclusion is assumed."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>} />;
}
