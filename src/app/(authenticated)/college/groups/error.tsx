"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function CollegeGroupsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState
    title="Student groups unavailable"
    description="The student-group list could not be loaded. This does not mean the college has no groups."
    action={<button type="button" onClick={reset}
      className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Retry
    </button>}
  />;
}
